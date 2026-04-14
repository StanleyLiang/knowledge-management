import { Type } from '@sinclair/typebox'

const SpaceTypeEnum = Type.Union([
  Type.Literal('PERSONAL'),
  Type.Literal('TEAM'),
  Type.Literal('OFFICIAL'),
])

export const CreateSpaceBody = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 200 }),
  description: Type.Optional(Type.String({ maxLength: 1000 })),
  type: Type.Optional(SpaceTypeEnum),
})

export const UpdateSpaceBody = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1, maxLength: 200 })),
  description: Type.Optional(Type.String({ maxLength: 1000 })),
  type: Type.Optional(SpaceTypeEnum),
})

export const IdParam = Type.Object({
  id: Type.String(),
})
