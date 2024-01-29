import type { ResultAsync } from 'neverthrow'
import type { z, ZodError } from 'zod'
import {
  array,
  boolean,
  literal,
  number,
  object,
  string,
  union,
  any,
} from 'zod'

/**
 * Wallet schemas
 */

export type Account = z.infer<typeof Account>
export const Account = object({
  address: string(),
  label: string(),
  appearanceId: number(),
})

export type Proof = z.infer<typeof Proof>
export const Proof = object({
  publicKey: string(),
  signature: string(),
  curve: union([literal('curve25519'), literal('secp256k1')]),
})

export type AccountProof = z.infer<typeof AccountProof>
export const AccountProof = object({
  accountAddress: string(),
  proof: Proof,
})

export type Persona = z.infer<typeof Persona>
export const Persona = object({ identityAddress: string(), label: string() })

export const personaDataFullNameVariant = {
  western: 'western',
  eastern: 'eastern',
} as const
export type PersonaDataNameVariant = z.infer<typeof PersonaDataNameVariant>
export const PersonaDataNameVariant = union([
  literal(personaDataFullNameVariant.eastern),
  literal(personaDataFullNameVariant.western),
])

export type PersonaDataName = z.infer<typeof PersonaDataName>
export const PersonaDataName = object({
  variant: PersonaDataNameVariant,
  familyName: string(),
  nickname: string(),
  givenNames: string(),
})

export type NumberOfValues = z.infer<typeof NumberOfValues>
export const NumberOfValues = object({
  quantifier: union([literal('exactly'), literal('atLeast')]),
  quantity: number().gte(0),
})

export type AccountsRequestItem = z.infer<typeof AccountsRequestItem>
export const AccountsRequestItem = object({
  challenge: string().optional(),
  numberOfAccounts: NumberOfValues,
})

export type AccountsRequestResponseItem = z.infer<
  typeof AccountsRequestResponseItem
>
export const AccountsRequestResponseItem = object({
  accounts: array(Account),
  challenge: string().optional(),
  proofs: array(AccountProof).optional(),
}).refine((data) => {
  if (data.challenge || data?.proofs) {
    return data.challenge && data?.proofs?.length
  }
  return true
}, 'missing challenge or proofs')

export type PersonaDataRequestItem = z.infer<typeof PersonaDataRequestItem>
export const PersonaDataRequestItem = object({
  isRequestingName: boolean().optional(),
  numberOfRequestedEmailAddresses: NumberOfValues.optional(),
  numberOfRequestedPhoneNumbers: NumberOfValues.optional(),
})

export type PersonaDataRequestResponseItem = z.infer<
  typeof PersonaDataRequestResponseItem
>
export const PersonaDataRequestResponseItem = object({
  name: PersonaDataName.optional(),
  emailAddresses: array(string()).optional(),
  phoneNumbers: array(string()).optional(),
})

export type ResetRequestItem = z.infer<typeof ResetRequestItem>
export const ResetRequestItem = object({
  accounts: boolean(),
  personaData: boolean(),
})

export type LoginRequestResponseItem = z.infer<typeof LoginRequestResponseItem>
export const LoginRequestResponseItem = object({
  persona: Persona,
  challenge: string().optional(),
  proof: Proof.optional(),
}).refine((data) => {
  if (data.challenge || data.proof) {
    return data.challenge && data.proof
  }
  return true
}, 'missing challenge or proof')

export type WalletUnauthorizedRequestItems = z.infer<
  typeof WalletUnauthorizedRequestItems
>
export const WalletUnauthorizedRequestItems = object({
  discriminator: literal('unauthorizedRequest'),
  oneTimeAccounts: AccountsRequestItem.optional(),
  oneTimePersonaData: PersonaDataRequestItem.optional(),
})

export type AuthUsePersonaRequestItem = z.infer<
  typeof AuthUsePersonaRequestItem
>
export const AuthUsePersonaRequestItem = object({
  discriminator: literal('usePersona'),
  identityAddress: string(),
})

export type AuthLoginWithoutChallengeRequestItem = z.infer<
  typeof AuthLoginWithoutChallengeRequestItem
>
export const AuthLoginWithoutChallengeRequestItem = object({
  discriminator: literal('loginWithoutChallenge'),
})

export type AuthLoginWithChallengeRequestItem = z.infer<
  typeof AuthLoginWithChallengeRequestItem
>
export const AuthLoginWithChallengeRequestItem = object({
  discriminator: literal('loginWithChallenge'),
  challenge: string(),
})

export const AuthLoginRequestItem = union([
  AuthLoginWithoutChallengeRequestItem,
  AuthLoginWithChallengeRequestItem,
])
export const AuthRequestItem = union([
  AuthUsePersonaRequestItem,
  AuthLoginRequestItem,
])

export type WalletAuthorizedRequestItems = z.infer<
  typeof WalletAuthorizedRequestItems
>
export const WalletAuthorizedRequestItems = object({
  discriminator: literal('authorizedRequest'),
  auth: AuthRequestItem,
  reset: ResetRequestItem.optional(),
  oneTimeAccounts: AccountsRequestItem.optional(),
  ongoingAccounts: AccountsRequestItem.optional(),
  oneTimePersonaData: PersonaDataRequestItem.optional(),
  ongoingPersonaData: PersonaDataRequestItem.optional(),
})

export type WalletRequestItems = z.infer<typeof WalletRequestItems>
export const WalletRequestItems = union([
  WalletUnauthorizedRequestItems,
  WalletAuthorizedRequestItems,
])

export type SendTransactionItem = z.infer<typeof SendTransactionItem>
export const SendTransactionItem = object({
  transactionManifest: string(),
  version: number(),
  blobs: array(string()).optional(),
  message: string().optional(),
})

export type WalletTransactionItems = z.infer<typeof WalletTransactionItems>
export const WalletTransactionItems = object({
  discriminator: literal('transaction'),
  send: SendTransactionItem,
})

export type SendTransactionResponseItem = z.infer<
  typeof SendTransactionResponseItem
>
export const SendTransactionResponseItem = object({
  transactionIntentHash: string(),
})

export type WalletTransactionResponseItems = z.infer<
  typeof WalletTransactionResponseItems
>
const WalletTransactionResponseItems = object({
  discriminator: literal('transaction'),
  send: SendTransactionResponseItem,
})

export type CancelRequest = z.infer<typeof CancelRequest>
export const CancelRequest = object({
  discriminator: literal('cancelRequest'),
})

export type WalletInteractionItems = z.infer<typeof WalletInteractionItems>
export const WalletInteractionItems = union([
  WalletRequestItems,
  WalletTransactionItems,
  CancelRequest,
])

export type Metadata = z.infer<typeof Metadata>
export const Metadata = object({
  version: literal(2),
  networkId: number(),
  dAppDefinitionAddress: string(),
})

export const WalletInteractionArbitraryData = object({
  sessionId: string().optional(),
}).or(any())

export type WalletInteractionArbitraryData = z.infer<
  typeof WalletInteractionArbitraryData
>

export type MetadataWithOrigin = z.infer<typeof MetadataWithOrigin>
export const MetadataWithOrigin = Metadata.and(object({ origin: string() }))

export type WalletInteraction = z.infer<typeof WalletInteraction>
export const WalletInteraction = object({
  interactionId: string(),
  discriminator: literal('walletInteraction'),
  metadata: Metadata,
  items: WalletInteractionItems,
  arbitraryData: WalletInteractionArbitraryData.optional(),
})

export const linkClientInteractionPurpose = {
  general: 'general',
} as const

export type LinkClientInteraction = z.infer<typeof LinkClientInteraction>
export const LinkClientInteraction = object({
  discriminator: literal('linkClient'),
  clientId: string(),
  purpose: literal(linkClientInteractionPurpose.general),
})

export type HandshakeInteraction = z.infer<typeof HandshakeInteraction>
export const HandshakeInteraction = object({
  discriminator: literal('handshake'),
  metadata: object({
    clientVersion: string(),
    client: string(),
    osVersion: string(),
  }),
})

export type AccountListRequestInteraction = z.infer<
  typeof AccountListRequestInteraction
>
export const AccountListRequestInteraction = object({
  discriminator: literal('accountListRequest'),
})

export type AccountListInteraction = z.infer<typeof AccountListInteraction>
export const AccountListInteraction = object({
  discriminator: literal('accountList'),
  accountsHash: string(),
})

export type AccountListResponseInteraction = z.infer<
  typeof AccountListResponseInteraction
>
export const AccountListResponseInteraction = object({
  discriminator: literal('accountListResponse'),
  accountsHash: string(),
  accounts: Account.array(),
})

export type WalletInteractionWithOrigin = z.infer<
  typeof WalletInteractionWithOrigin
>

export const WalletInteractionWithOrigin = WalletInteraction.and(
  object({ metadata: MetadataWithOrigin }),
)

export type WalletUnauthorizedRequestResponseItems = z.infer<
  typeof WalletUnauthorizedRequestResponseItems
>
const WalletUnauthorizedRequestResponseItems = object({
  discriminator: literal('unauthorizedRequest'),
  oneTimeAccounts: AccountsRequestResponseItem.optional(),
  oneTimePersonaData: PersonaDataRequestResponseItem.optional(),
})

export type AuthLoginWithoutChallengeRequestResponseItem = z.infer<
  typeof AuthLoginWithoutChallengeRequestResponseItem
>
export const AuthLoginWithoutChallengeRequestResponseItem = object({
  discriminator: literal('loginWithoutChallenge'),
  persona: Persona,
})

export type AuthLoginWithChallengeRequestResponseItem = z.infer<
  typeof AuthLoginWithChallengeRequestResponseItem
>
export const AuthLoginWithChallengeRequestResponseItem = object({
  discriminator: literal('loginWithChallenge'),
  persona: Persona,
  challenge: string(),
  proof: Proof,
})

export const AuthLoginRequestResponseItem = union([
  AuthLoginWithoutChallengeRequestResponseItem,
  AuthLoginWithChallengeRequestResponseItem,
])

export type AuthUsePersonaRequestResponseItem = z.infer<
  typeof AuthUsePersonaRequestResponseItem
>
const AuthUsePersonaRequestResponseItem = object({
  discriminator: literal('usePersona'),
  persona: Persona,
})

export type AuthRequestResponseItem = z.infer<typeof AuthRequestResponseItem>
export const AuthRequestResponseItem = union([
  AuthUsePersonaRequestResponseItem,
  AuthLoginRequestResponseItem,
])

export type WalletAuthorizedRequestResponseItems = z.infer<
  typeof WalletAuthorizedRequestResponseItems
>
export const WalletAuthorizedRequestResponseItems = object({
  discriminator: literal('authorizedRequest'),
  auth: AuthRequestResponseItem,
  oneTimeAccounts: AccountsRequestResponseItem.optional(),
  ongoingAccounts: AccountsRequestResponseItem.optional(),
  oneTimePersonaData: PersonaDataRequestResponseItem.optional(),
  ongoingPersonaData: PersonaDataRequestResponseItem.optional(),
})

export type WalletRequestResponseItems = z.infer<
  typeof WalletRequestResponseItems
>
export const WalletRequestResponseItems = union([
  WalletUnauthorizedRequestResponseItems,
  WalletAuthorizedRequestResponseItems,
])

export type WalletInteractionResponseItems = z.infer<
  typeof WalletInteractionResponseItems
>
const WalletInteractionResponseItems = union([
  WalletRequestResponseItems,
  WalletTransactionResponseItems,
])

export type WalletInteractionSuccessResponse = z.infer<
  typeof WalletInteractionSuccessResponse
>
export const WalletInteractionSuccessResponse = object({
  discriminator: literal('success'),
  interactionId: string(),
  items: WalletInteractionResponseItems,
})

export type WalletInteractionFailureResponse = z.infer<
  typeof WalletInteractionFailureResponse
>
export const WalletInteractionFailureResponse = object({
  discriminator: literal('failure'),
  interactionId: string(),
  error: string(),
  message: string().optional(),
})

export type WalletInteractionResponse = z.infer<
  typeof WalletInteractionResponse
>
export const WalletInteractionResponse = union([
  WalletInteractionSuccessResponse,
  WalletInteractionFailureResponse,
])

export const extensionInteractionDiscriminator = {
  extensionStatus: 'extensionStatus',
  removeSessionId: 'removeSessionId',
  openPopup: 'openPopup',
} as const

export const RemoveSessionIdInteraction = object({
  interactionId: string(),
  discriminator: literal(extensionInteractionDiscriminator.removeSessionId),
  sessionId: string(),
})

export type RemoveSessionIdInteraction = z.infer<
  typeof RemoveSessionIdInteraction
>

export const StatusExtensionInteraction = object({
  interactionId: string(),
  discriminator: literal(extensionInteractionDiscriminator.extensionStatus),
})

export type StatusExtensionInteraction = z.infer<
  typeof StatusExtensionInteraction
>

export const OpenPopupExtensionInteraction = object({
  interactionId: string(),
  discriminator: literal(extensionInteractionDiscriminator.openPopup),
})

export type OpenPopupExtensionInteraction = z.infer<
  typeof OpenPopupExtensionInteraction
>

export const ExtensionInteraction = union([
  StatusExtensionInteraction,
  OpenPopupExtensionInteraction,
  RemoveSessionIdInteraction,
])

export type ExtensionInteraction = z.infer<typeof ExtensionInteraction>

export const messageLifeCycleEventType = {
  extensionStatus: 'extensionStatus',
  receivedByExtension: 'receivedByExtension',
  receivedByWallet: 'receivedByWallet',
  requestCancelSuccess: 'requestCancelSuccess',
  requestCancelFail: 'requestCancelFail',
} as const

export const MessageLifeCycleExtensionStatusEvent = object({
  eventType: literal(messageLifeCycleEventType.extensionStatus),
  interactionId: string(),
  isWalletLinked: boolean(),
  isExtensionAvailable: boolean(),
})

export type MessageLifeCycleExtensionStatusEvent = z.infer<
  typeof MessageLifeCycleExtensionStatusEvent
>

export const MessageLifeCycleEvent = object({
  eventType: union([
    literal(messageLifeCycleEventType.extensionStatus),
    literal(messageLifeCycleEventType.receivedByExtension),
    literal(messageLifeCycleEventType.receivedByWallet),
    literal(messageLifeCycleEventType.requestCancelSuccess),
    literal(messageLifeCycleEventType.requestCancelFail),
  ]),
  interactionId: string(),
})

export type MessageLifeCycleEvent = z.infer<typeof MessageLifeCycleEvent>

export type IncomingMessage = z.infer<typeof IncomingMessage>
const IncomingMessage = union([
  MessageLifeCycleEvent,
  WalletInteractionResponse,
])

export const eventType = {
  outgoingMessage: 'radix#chromeExtension#send',
  incomingMessage: 'radix#chromeExtension#receive',
} as const

export type CallbackFns = {
  eventCallback: (messageEvent: MessageLifeCycleEvent['eventType']) => void
  requestControl: (api: {
    cancelRequest: () => ResultAsync<
      'requestCancelSuccess',
      'requestCancelFail'
    >
    getRequest: () => WalletInteraction
  }) => void
}

/**
 * Signaling server schemas
 */

const Offer = literal('offer')
const Answer = literal('answer')
const IceCandidate = literal('iceCandidate')
const IceCandidates = literal('iceCandidates')

const Types = union([Offer, Answer, IceCandidate, IceCandidates])

export const Sources = union([literal('wallet'), literal('extension')])

export const SignalingServerMessage = object({
  requestId: string(),
  targetClientId: string(),
  encryptedPayload: string(),
  source: Sources.optional(), // redundant, to be removed
  connectionId: string().optional(), // redundant, to be removed
})

export const AnswerIO = SignalingServerMessage.extend({
  method: Answer,
  payload: object({
    sdp: string(),
  }),
})

export const OfferIO = SignalingServerMessage.extend({
  method: Offer,
  payload: object({
    sdp: string(),
  }),
})

const IceCandidatePayloadIO = object({
  candidate: string(),
  sdpMid: string(),
  sdpMLineIndex: number(),
})

export const IceCandidateIO = SignalingServerMessage.extend({
  method: IceCandidate,
  payload: IceCandidatePayloadIO,
})

export const IceCandidatesIO = SignalingServerMessage.extend({
  method: IceCandidates,
  payload: array(IceCandidatePayloadIO),
})

export type Answer = z.infer<typeof AnswerIO>
export type Offer = z.infer<typeof OfferIO>
export type IceCandidate = z.infer<typeof IceCandidateIO>
export type IceCandidates = z.infer<typeof IceCandidatesIO>
export type MessagePayloadTypes = z.infer<typeof Types>
export type MessageSources = z.infer<typeof Sources>

export type DataTypes = Answer | IceCandidate | Offer | IceCandidates

export type Confirmation = {
  info: 'confirmation'
  requestId: DataTypes['requestId']
}

export type RemoteData<T extends DataTypes = DataTypes> = {
  info: 'remoteData'
  remoteClientId: string
  requestId: T['requestId']
  data: T
}

export type RemoteClientDisconnected = {
  info: 'remoteClientDisconnected'
  remoteClientId: string
}

export type RemoteClientJustConnected = {
  info: 'remoteClientJustConnected'
  remoteClientId: string
}

export type RemoteClientIsAlreadyConnected = {
  info: 'remoteClientIsAlreadyConnected'
  remoteClientId: string
}

export type MissingRemoteClientError = {
  info: 'missingRemoteClientError'
  requestId: DataTypes['requestId']
}

export type InvalidMessageError = {
  info: 'invalidMessageError'
  error: string
  data: string
}

export type ValidationError = {
  info: 'validationError'
  requestId: DataTypes['requestId']
  error: ZodError[]
}

export type SignalingServerResponse =
  | Confirmation
  | RemoteData
  | RemoteClientJustConnected
  | RemoteClientIsAlreadyConnected
  | RemoteClientDisconnected
  | MissingRemoteClientError
  | InvalidMessageError
  | ValidationError

export type SignalingServerErrorResponse =
  | RemoteClientDisconnected
  | MissingRemoteClientError
  | InvalidMessageError
  | ValidationError
