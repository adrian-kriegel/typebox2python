"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const semver_1 = __importDefault(require("semver"));
const capitalize = (s) => s.charAt(0).toUpperCase() + s.substring(1);
/**
 *
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars, require-jsdoc
class Converter {
    /**
     * @param pythonVersion python target version
     */
    constructor(pythonVersion = '3.10.0') {
        this.String = () => 'str';
        this.Number = () => 'float';
        this.Integer = () => 'int';
        this.Null = () => 'None';
        this.Undefined = () => 'None';
        this.Object = (name, o) => {
            const props = Object.entries(o.properties || {}).map(([key, schema]) => (`'${key}': ` + this.toType(`name.${key}`, schema))).join(',\n');
            return `typing.TypedDict('${name}',{\n${props}\n})`;
        };
        this.Array = (name, s) => `list[${this.toType(`${name}.items`, s.items)}]`;
        this.Union = (name, s) => 'typing.Union[\n' +
            s.anyOf.map((u, i) => this.toType(`${name}.${i}`, u)).join(',\n') +
            '\n]';
        this.Boolean = () => 'bool';
        this.Enum = (name, s) => 'typing.Literal[\n' +
            s.anyOf.map((u, i) => this.toType(`${name}.${i}`, u)).join(',\n') +
            '\n]';
        this.Literal = (name, s) => 'typing.Literal[\n' +
            this.toType(name, s.const) +
            ']';
        this.Optional = (name, s) => `NotRequired[${this.toType(name, s)}]`;
        this.Record = (name, s) => 'dict[str, ' +
            this.toType(`${name}.value`, Object.values(s.patternProperties)[0]) + ']';
        const v = semver_1.default.parse(pythonVersion);
        if (v) {
            this.targetV = v;
        }
        else {
            throw new Error(`Invalid target version: ${pythonVersion}`);
        }
    }
    /**
     * Convert a schema to python code.
     *
     * TODO: add support for $ref
     *
     * @param name name to give the type
     * @param inputSchema schema generated using typebox
     * @returns python type code
     */
    toType(name, inputSchema) {
        var _a, _b;
        const schema = Object.assign({}, inputSchema);
        if ('const' in schema) {
            return typeof (schema.const) === 'string' ?
                `typing.Literal['${schema.const}']` :
                `typing.Literal[${schema.const}]`;
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
        const type = extractType(schema.modifier || schema.kind) || schema.type;
        if (schema.modifier) {
            delete schema.modifier;
        }
        if (schema && type in this) {
            return (_b = (_a = this)[type]) === null || _b === void 0 ? void 0 : _b.call(_a, name, schema);
        }
        else {
            return 'typing.Any';
        }
    }
    /**
     * @param schemas map of schemas
     * @returns code as string[]
     */
    toModule(schemas) {
        return [
            'import typing',
            semver_1.default.gte(this.targetV, '3.11.0') ?
                'from typing import NotRequired' :
                'from typing_extensions import NotRequired',
            ...Object.entries(schemas).map(([name, schema]) => capitalize(name) +
                ' = ' +
                this.toType(capitalize(name), schema)),
        ];
    }
}
/**
 * @param symbol symbol
 * @returns string type
 */
function extractType(symbol) {
    var _a;
    return (_a = symbol.description) === null || _a === void 0 ? void 0 : _a.replace('Kind', '').replace('Modifier', '');
}
/**
 * @param schemas schemas
 * @param pythonVersion target version
 * @returns python module code as list of strings
 */
function toModule(schemas, pythonVersion = '3.10.0') {
    return new Converter(pythonVersion)
        .toModule(schemas);
}
exports.default = toModule;
