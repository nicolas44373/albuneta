export type Profile = {
  id: string
  username: string
  avatar_url: string | null
  city: string | null
  province: string | null
  reputation: number
  trades_completed: number
  created_at: string
}

export type Album = {
  id: string
  name: string
  year: number
  total_stickers: number
  image_url: string | null
}

export type Sticker = {
  id: string
  album_id: string
  number: number
  player_name: string | null
  team: string | null
  section: string | null
  rarity: 'common' | 'rare' | 'special' | 'foil'
}

export type UserSticker = {
  id: string
  user_id: string
  sticker_id: string
  quantity: number
  status: 'have' | 'need'
  sticker?: Sticker
}

export type StickerWithStatus = Sticker & {
  userStatus: 'have' | 'need' | null
  quantity: number
}

export type Match = {
  id: string
  user_a: string
  user_b: string
  match_percentage: number
  stickers_a_to_b: number[]
  stickers_b_to_a: number[]
  status: 'pending' | 'accepted' | 'completed' | 'cancelled'
  created_at: string
  profile_a?: Profile
  profile_b?: Profile
}

export type Chat = {
  id: string
  match_id: string
  created_at: string
}

export type Message = {
  id: string
  chat_id: string
  sender_id: string
  content: string
  created_at: string
  sender?: Profile
}

export type Rating = {
  id: string
  rater_id: string
  rated_id: string
  match_id: string
  score: number
  comment: string | null
}
