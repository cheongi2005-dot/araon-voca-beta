import { useCallback, useMemo } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { auth, db } from '../firebase-config';
import { useUserData } from '../contexts/UserDataContext';

// 즐겨찾기는 users/{email}.favorites 에 "레벨키|단어" 문자열로 저장 (예: "level-2|advance").
// UserDataContext 구독이 바로 반영되므로 별도 로컬 상태가 없다.
export const favoriteId = (levelId, word) => `${levelId}|${word}`;
export const parseFavoriteId = (id) => { const i = id.indexOf('|'); return { levelId: id.slice(0, i), word: id.slice(i + 1) }; };

const NONE = [];

export const useFavorites = () => {
  const { userData } = useUserData();
  const list = userData?.favorites || NONE;
  const ids = useMemo(() => new Set(list), [list]);

  const isFavorite = useCallback((levelId, word) => ids.has(favoriteId(levelId, word)), [ids]);
  const toggleFavorite = useCallback((levelId, word) => {
    const email = auth.currentUser?.email;
    if (!email) return;
    const id = favoriteId(levelId, word);
    updateDoc(doc(db, 'users', email), { favorites: ids.has(id) ? arrayRemove(id) : arrayUnion(id) })
      .catch(e => console.error('[favorites] 저장 실패:', e));
  }, [ids]);

  return { favoriteIds: list, isFavorite, toggleFavorite };
};
