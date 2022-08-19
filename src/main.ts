
import {
  Kind,
  Modifier,
  TSchema,
  TypeBuilder,
} from '@sinclair/typebox';

const capitalize = (s : string) => 
  s.charAt(0).toUpperCase() + s.substring(1)
;


const toString : Partial<{ 
  [k in keyof TypeBuilder]: <T extends TSchema>(name: string, s : T) => string
}> = 
{
  String: () => 'str',
  Number: () => 'float',
  Integer: () => 'int',
  Null: () => 'None',
  Undefined: () => 'None',

  Object: (name, o) => 
  {
    const props = Object.entries(o.properties).map(
      ([key, schema]) => (
        `'${key}': ` + toType(`name.${key}`, schema as TSchema)
      ),
    ).join(',\n');

    return `TypedDict('${name}',{\n${props}\n})`; 
  },

  Array: (name, s) => `list[${toType(`${name}.items`, s.items)}]`,

  Union: (name, s) => 
    'typing.Union[\n' +
    s.anyOf.map((u : TSchema, i : number) => 
      toType(`${name}.${i}`, u)).join(',\n') +
    '\n]',

  Boolean: () => 'bool',

  Enum: (name, s) => 
    'typing.Literal[\n' +
    s.anyOf.map((u : TSchema, i : number) => 
      toType(`${name}.${i}`, u)).join(',\n') +
    '\n]',

  Literal: (name, s) => 
    'typing.Literal[\n' +
    toType(name, s.const) +
    ']',
    
  Optional: (name, s) => `Optional[${toType(name, s)}]`,
};

/**
 * Convert a schema to python code.
 * 
 * TODO: add support for $ref
 * 
 * @param name name to give the type
 * @param inputSchema schema generated using typebox
 * @returns python type code
 */
export function toType(
  name : string,
  inputSchema : TSchema,
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

  // take either the modifier, kind or type from the schema
  const kind = 
    (schema[Modifier]) && (schema[Modifier] in (toString as any)) ?
      schema[Modifier] :
      schema[Kind] && (schema[Kind] in (toString as any)) ? 
        schema[Kind] : 
        capitalize(schema.type)
  ;

  if (Modifier in schema)
  {
    delete schema[Modifier];
  }

  if (schema && kind in toString)
  {
    return toString[kind as keyof typeof toString]?.(name, schema);
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
export default function toModule(
  schemas : { [name: string]: TSchema },
)
{
  return [
    'import typing',
    ...Object.entries(schemas).map(
      ([name, schema]) => 
        capitalize(name) + 
        ' = ' + 
        toType(name, schema),
    ),
  ];
}

