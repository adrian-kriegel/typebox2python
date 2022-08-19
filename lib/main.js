"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toType = void 0;
const typebox_1 = require("@sinclair/typebox");
const capitalize = (s) => s.charAt(0).toUpperCase() + s.substring(1);
const toString = {
    String: () => 'str',
    Number: () => 'float',
    Integer: () => 'int',
    Null: () => 'None',
    Undefined: () => 'None',
    Object: (name, o) => {
        const props = Object.entries(o.properties).map(([key, schema]) => (`'${key}': ` + toType(`name.${key}`, schema))).join(',\n');
        return `TypedDict('${name}',{\n${props}\n})`;
    },
    Array: (name, s) => `list[${toType(`${name}.items`, s.items)}]`,
    Union: (name, s) => 'typing.Union[\n' +
        s.anyOf.map((u, i) => toType(`${name}.${i}`, u)).join(',\n') +
        '\n]',
    Boolean: () => 'bool',
    Enum: (name, s) => 'typing.Literal[\n' +
        s.anyOf.map((u, i) => toType(`${name}.${i}`, u)).join(',\n') +
        '\n]',
    Literal: (name, s) => 'typing.Literal[\n' +
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
function toType(name, inputSchema) {
    var _a;
    const schema = Object.assign({}, inputSchema);
    if ('const' in schema) {
        return typeof (schema.const) === 'string' ?
            `'${schema.const}'` :
            schema.const;
    }
    // take either the modifier, kind or type from the schema
    const kind = (schema[typebox_1.Modifier]) && (schema[typebox_1.Modifier] in toString) ?
        schema[typebox_1.Modifier] :
        schema[typebox_1.Kind] && (schema[typebox_1.Kind] in toString) ?
            schema[typebox_1.Kind] :
            capitalize(schema.type);
    if (typebox_1.Modifier in schema) {
        delete schema[typebox_1.Modifier];
    }
    if (schema && kind in toString) {
        return (_a = toString[kind]) === null || _a === void 0 ? void 0 : _a.call(toString, name, schema);
    }
    else {
        return 'typing.Any';
    }
}
exports.toType = toType;
/**
 * @param schemas map of schemas
 * @returns code as string[]
 */
function toModule(schemas) {
    return [
        'import typing',
        ...Object.entries(schemas).map(([name, schema]) => capitalize(name) +
            ' = ' +
            toType(name, schema)),
    ];
}
exports.default = toModule;
