import { TSchema } from '@sinclair/typebox';
/**
 * @param schemas schemas
 * @param pythonVersion target version
 * @returns python module code as list of strings
 */
export default function toModule(schemas: {
    [name: string]: TSchema;
}, pythonVersion?: string): string[];
