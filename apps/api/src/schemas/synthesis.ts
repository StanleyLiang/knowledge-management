import { Type } from '@sinclair/typebox'

export const SynthesisSpaceParam = Type.Object({
  spaceId: Type.String(),
})

export const SynthesisIdParam = Type.Object({
  id: Type.String(),
})

export const GenerateBody = Type.Object({
  eps: Type.Optional(Type.Number({ minimum: 0, maximum: 2 })),
  minPoints: Type.Optional(Type.Integer({ minimum: 2, maximum: 50 })),
})

export const UpdateSynthesisBody = Type.Object({
  title: Type.Optional(Type.String({ minLength: 1, maxLength: 500 })),
  summary: Type.Optional(Type.String()),
  contradictions: Type.Optional(Type.String()),
  openQuestions: Type.Optional(Type.String()),
  status: Type.Optional(
    Type.Union([
      Type.Literal('PENDING'),
      Type.Literal('ACCEPTED'),
      Type.Literal('REJECTED'),
      Type.Literal('EDITED'),
    ]),
  ),
})

export const ListSynthesesQuery = Type.Object({
  spaceId: Type.String(),
  status: Type.Optional(
    Type.Union([
      Type.Literal('PENDING'),
      Type.Literal('ACCEPTED'),
      Type.Literal('REJECTED'),
      Type.Literal('EDITED'),
    ]),
  ),
})
