import { TSchema } from '@sinclair/typebox';
/**
 * Convert a schema to python code.
 *
 * TODO: add support for $ref
 *
 * @param name name to give the type
 * @param inputSchema schema generated using typebox
 * @returns python type code
 */
export declare function toType(name: string, inputSchema: any): any;
/**
 * @param schemas map of schemas
 * @returns code as string[]
 */
export default function toModule(schemas: {
    [name: string]: TSchema;
}): string[];
