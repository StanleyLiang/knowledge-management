import { Type } from '@sinclair/typebox'

export const CreateSpaceBody = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 200 }),
  description: Type.Optional(Type.String({ maxLength: 1000 })),
})

export const UpdateSpaceBody = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1, maxLength: 200 })),
  description: Type.Optional(Type.String({ maxLength: 1000 })),
})

export const IdParam = Type.Object({
  id: Type.String(),
})
