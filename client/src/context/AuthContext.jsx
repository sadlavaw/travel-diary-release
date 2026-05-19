import React, { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [friends, setFriends] = useState([])

  useEffect(() => {
    const token = localStorage.getItem('td_token')
    if (!token) {
      setLoading(false)
      return
    }
    api.me()
      .then(data => {
        const u = data.user ?? data
        setUser(u)
        return api.getFriends()
      })
      .then(f => setFriends(f || []))
      .catch(() => {
        localStorage.removeItem('td_token')
        setFriends([])
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    try {
      const data = await api.login(email, password)
      localStorage.setItem('td_token', data.token)
      setUser(data.user)
      const f = await api.getFriends().catch(() => [])
      setFriends(f || [])
      return { success: true }
    } catch (err) {
      return { error: err.message }
    }
  }

  const register = async (name, username, email, password) => {
    try {
      const data = await api.register(name, username, email, password)
      localStorage.setItem('td_token', data.token)
      setUser(data.user)
      setFriends([])
      return { success: true }
    } catch (err) {
      return { error: err.message }
    }
  }

  const logout = () => {
    localStorage.removeItem('td_token')
    setUser(null)
    setFriends([])
  }

  const updateProfile = (updates) => {
    setUser(prev => ({ ...prev, ...updates }))
    api.updateProfile({ name: updates.name ?? user?.name, bio: updates.bio ?? user?.bio, avatar: updates.avatar ?? user?.avatar })
      .then(updated => setUser(updated))
      .catch(() => {})
  }

  const getUserById = (id) => {
    if (!id) return null
    if (id === user?.id) return user
    return friends.find(f => f.id === id) || null
  }

  const findUserBySlug = async (slug) => {
    if (!slug) return null
    try {
      return await api.getUserBySlug(slug)
    } catch {
      return null
    }
  }

  const searchUsers = async (q) => {
    try {
      return await api.searchUsers(q)
    } catch {
      return []
    }
  }

  const addFriend = async (friendId) => {
    try {
      const friend = await api.addFriend(friendId)
      setFriends(prev => {
        if (prev.some(f => f.id === friend.id)) return prev
        return [...prev, friend]
      })
      return true
    } catch {
      return false
    }
  }

  const removeFriend = async (friendId) => {
    try {
      await api.removeFriend(friendId)
      setFriends(prev => prev.filter(f => f.id !== friendId))
      return true
    } catch {
      return false
    }
  }

  const isFriend = (userId) => friends.some(f => f.id === userId)

  const getFriends = () => friends

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout, updateProfile,
      getUserById, findUserBySlug, searchUsers,
      addFriend, removeFriend, isFriend, getFriends,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
