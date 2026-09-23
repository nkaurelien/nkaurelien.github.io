import fs from 'fs';
import path from 'path';

const PRISMA_SCHEMA_PATH = path.resolve(process.cwd(), 'prisma/schema.prisma');

export interface PrismaModelField {
  name: string;
  type: string;
  isOptional: boolean;
  isArray: boolean;
  attributes: string[];
}

export interface PrismaModel {
  name: string;
  documentation?: string;
  fields: PrismaModelField[];
}

export interface SchemaSummary {
  datasource?: { provider?: string; urlEnv?: string };
  generator?: { provider?: string; output?: string };
  models: PrismaModel[];
  enums: Array<{ name: string; values: string[] }>;
}

export function getSchemaSummary(): SchemaSummary {
  if (!fs.existsSync(PRISMA_SCHEMA_PATH)) {
    throw new Error(`Fichier schema.prisma introuvable à l'emplacement : ${PRISMA_SCHEMA_PATH}`);
  }

  const content = fs.readFileSync(PRISMA_SCHEMA_PATH, 'utf8');
  const lines = content.split('\n');

  const summary: SchemaSummary = {
    models: [],
    enums: [],
  };

  let currentModel: PrismaModel | null = null;
  let currentEnum: { name: string; values: string[] } | null = null;
  let docBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (line.startsWith('///') || line.startsWith('//')) {
      docBuffer.push(line.replace(/^\/{2,3}\s?/, ''));
      continue;
    }

    if (!line) {
      continue;
    }

    // Match model declaration: model ContentEntry {
    const modelMatch = line.match(/^model\s+([A-Za-z0-9_]+)\s*\{/);
    if (modelMatch) {
      currentModel = {
        name: modelMatch[1],
        documentation: docBuffer.length > 0 ? docBuffer.join(' ') : undefined,
        fields: [],
      };
      docBuffer = [];
      continue;
    }

    // Match enum declaration: enum Role {
    const enumMatch = line.match(/^enum\s+([A-Za-z0-9_]+)\s*\{/);
    if (enumMatch) {
      currentEnum = {
        name: enumMatch[1],
        values: [],
      };
      docBuffer = [];
      continue;
    }

    if (line === '}') {
      if (currentModel) {
        summary.models.push(currentModel);
        currentModel = null;
      }
      if (currentEnum) {
        summary.enums.push(currentEnum);
        currentEnum = null;
      }
      docBuffer = [];
      continue;
    }

    if (currentModel) {
      // Model field or block attributes
      if (line.startsWith('@@')) {
        continue;
      }
      const parts = line.split(/\s+/);
      if (parts.length >= 2) {
        const fieldName = parts[0];
        let fieldType = parts[1];
        const isOptional = fieldType.endsWith('?');
        const isArray = fieldType.endsWith('[]');
        fieldType = fieldType.replace(/[?\[\]]/g, '');

        const attributes = parts.slice(2);
        currentModel.fields.push({
          name: fieldName,
          type: fieldType,
          isOptional,
          isArray,
          attributes,
        });
      }
    } else if (currentEnum) {
      if (!line.startsWith('//')) {
        currentEnum.values.push(line);
      }
    }
  }

  return summary;
}
