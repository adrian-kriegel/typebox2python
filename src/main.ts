
import {
  TSchema,
} from '@sinclair/typebox';

import semver, { SemVer } from 'semver';

const capitalize = (s : string) => 
  s.charAt(0).toUpperCase() + s.substring(1)
;

type SchemaConverterFunction = (
  name : string, schema : any,
) => string

/**
 * 
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars, require-jsdoc
class Converter
{
  targetV : SemVer;

  /**
   * @param pythonVersion python target version
   */
  constructor(pythonVersion : string = '3.10.0')
  {
    const v = semver.parse(pythonVersion);

    if (v)
    {
      this.targetV = v;
    }
    else 
    {
      throw new Error(`Invalid target version: ${pythonVersion}`);
    }
  }

  String = () => 'str';
  Number = () => 'float';
  Integer = () => 'int';
  Null = () => 'None';
  Undefined = () => 'None';

  Object : SchemaConverterFunction = (name, o) => 
  {
    const props = Object.entries(o.properties || {}).map(
      ([key, schema]) => (
        `'${key}': ` + this.toType(`name.${key}`, schema as TSchema)
      ),
    ).join(',\n');

    return `typing.TypedDict('${name}',{\n${props}\n})`; 
  };

  Array : SchemaConverterFunction = (name, s) => 
    `list[${this.toType(`${name}.items`, s.items)}]`;

  Union : SchemaConverterFunction = (name, s) => 
    'typing.Union[\n' +
    s.anyOf.map((u : TSchema, i : number) => 
      this.toType(`${name}.${i}`, u)).join(',\n') +
    '\n]';

  Boolean : SchemaConverterFunction = () => 'bool';

  Enum : SchemaConverterFunction = (name, s) => 
    'typing.Literal[\n' +
    s.anyOf.map((u : TSchema, i : number) => 
      this.toType(`${name}.${i}`, u)).join(',\n') +
    '\n]';

  Literal : SchemaConverterFunction = (name, s) => 
    'typing.Literal[\n' +
    this.toType(name, s.const) +
    ']';
    
  Optional : SchemaConverterFunction = (name, s) => 
    `NotRequired[${this.toType(name, s)}]`;

  Record : SchemaConverterFunction = (name, s) => 
    'dict[str, ' +
    this.toType(
      `${name}.value`, Object.values(s.patternProperties)[0] as TSchema,
    ) + ']';

  
  /**
   * Convert a schema to python code.
   * 
   * TODO: add support for $ref
   * 
   * @param name name to give the type
   * @param inputSchema schema generated using typebox
   * @returns python type code
   */
  toType(
    name : string,
    inputSchema : any,
  )
  {
    const schema = { ...inputSchema };

    if ('const' in schema)
    {
      return typeof(schema.const) === 'string' ?
        `'${schema.const}'` : 
        schema.const
      ;
    }

    /*
    // code for typebox@0.24

    // take either the modifier, kind or type from the schema
    const kind = 
      (schema[Modifier]) && (schema[Modifier] in (this as any)) ?
        schema[Modifier] :
        schema[Kind] && (schema[Kind] in (this as any)) ? 
          schema[Kind] : 
          schema.type && capitalize(schema.type)
    ;

    if (Modifier in schema)
    {
      delete schema[Modifier];
    }
    */

    const type = extractType(
      schema.modifier || schema.kind,
    ) || schema.type; 

    if (schema.modifier)
    {
      delete schema.modifier;
    }

    if (schema && type in this)
    {
      return (this as any)[type]?.(name, schema);
    }
    else 
    {
      return 'typing.Any';
    }
  }

  /**
   * @param schemas map of schemas
   * @returns code as string[]
   */
  toModule(
    schemas : { [name: string]: TSchema },
  )
  {
    return [
      'import typing',
      semver.gte(this.targetV, '3.11.0') ? 
        'from typing import NotRequired' : 
        'from typing_extensions import NotRequired',
      ...Object.entries(schemas).map(
        ([name, schema]) => 
          capitalize(name) + 
        ' = ' + 
        this.toType(capitalize(name), schema),
      ),
    ];
  }
}

/**
 * @param symbol symbol
 * @returns string type 
 */
function extractType(symbol : Symbol)
{
  return symbol.description?.replace('Kind', '').replace('Modifier', '');
}

/**
 * @param schemas schemas
 * @param pythonVersion target version
 * @returns python module code as list of strings 
 */
export default function toModule(
  schemas : { [name: string]: TSchema },
  pythonVersion = '3.10.0',
)
{
  return new Converter(pythonVersion)
    .toModule(schemas);
}

