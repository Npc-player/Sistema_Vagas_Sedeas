import { pgTable, uuid, text, date, timestamp, index, customType } from 'drizzle-orm/pg-core';

// Tipo customizado para BYTEA (campos criptografados com pgcrypto)
const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return 'bytea';
  },
});

export const acolhidos = pgTable('acolhidos', {
  id: uuid('id').primaryKey().defaultRandom(),
  nomeCompleto: text('nome_completo').notNull(),
  nomeSocial: text('nome_social'),
  dataNascimento: date('data_nascimento').notNull(),
  nomeMae: text('nome_mae'),
  nomePai: text('nome_pai'),
  cpfEncrypted: bytea('cpf_encrypted'),
  cpfHash: text('cpf_hash'),
  rgEncrypted: bytea('rg_encrypted'),
  alergiasEncrypted: bytea('alergias_encrypted'),
  comorbidadesEncrypted: bytea('comorbidades_encrypted'),
  familiaHistorico: text('familia_historico'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  cpfHashIdx: index('acolhidos_cpf_hash_idx').on(t.cpfHash),
  nomeIdx: index('acolhidos_nome_idx').on(t.nomeCompleto),
}));
