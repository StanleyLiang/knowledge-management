import { Type } from '@sinclair/typebox'

export const CreatePageBody = Type.Object({
  title: Type.Optional(Type.String({ minLength: 1, maxLength: 500 })),
})

export const UpdatePageBody = Type.Object({
  title: Type.Optional(Type.String({ minLength: 1, maxLength: 500 })),
  content: Type.Optional(Type.Any()),
})

export const SpaceIdParam = Type.Object({
  spaceId: Type.String(),
})

export const PageIdParam = Type.Object({
  id: Type.String(),
})
