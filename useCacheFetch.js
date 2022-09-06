import { useState, useEffect } from 'react'
import { useRecoilState } from 'recoil'
import { globalSelector } from 'selectors/classrooms'

const initialState = {
    loading: false,
    error: null,
    data: []
}

const checkHaveCached = (cached) => {
    const haveCachedData = typeof cached === 'object' 
    if (!haveCachedData || !cached) return false
    const arrayHaveData = Array.isArray(cached) && !!cached.length
    if (arrayHaveData) return true
    return !!Object.values(cached).length
}

const getGlobalData = (global, key, isMultiple ) => {
    if (!key || !isMultiple) return false
    const haveData = !!checkHaveCached(global[key])
    return haveData ? global[key] : false
}

const EXPIRE_IN_MS = 180000 // 3min


export const useFetch = ({ fetcher, selector, key, isMultiple = false, expiresIn = EXPIRE_IN_MS, dependency=[] }) => {
    if (!selector || !fetcher || typeof fetcher !== 'function') return null
    const [cached, setCached] = useRecoilState(selector)
    const [{ loading, error, data }, setState] = useState(initialState)
    const [global, setGlobal] = useRecoilState(globalSelector)

    const setExpiry = () => {
        const date = new Date()
        const future = date.setMilliseconds(expiresIn)
        const previous = sessionStorage.getItem('exp-cache')
        const previousCacheExp = previous ? JSON.parse(previous) : {}
        previousCacheExp[key] = future
        sessionStorage.setItem('exp-cache', JSON.stringify(previousCacheExp))
    }

    const removeOnExpiry = ()=>{
        const previous = sessionStorage.getItem('exp-cache')
        const previousCacheExp = previous ? JSON.parse(previous) : {}
        const future = previousCacheExp[key]
        if (future){
            const now = new Date().getTime()
            if(future <= now){
                const {[key]:older, ...other } = global
                setGlobal(other)
                return true
            }
        }
    }
   
    const refetch = async ()=>{
        try {
            setState({ ...initialState, loading: true })
            const newData = await fetcher()
            if (newData) {
                setState({ ...initialState, data: newData })
                setCached(newData)
                if(isMultiple && key){
                    setGlobal({...global, [key]:newData})
                    setExpiry()
                }
                return
            }
            setState({ ...initialState, error: "Something went wrong!!" })
            return
        } catch {
            setState({ ...initialState, error: "Something went wrong!!" })
        }
    }


    useEffect(() => {
        (async function () {
            const haveCachedData = checkHaveCached(cached)
            const globalData = getGlobalData(global, key, isMultiple)
            const removed = removeOnExpiry()
            if (globalData && !removed){
                setState({ ...initialState, data: globalData })
                setCached(globalData)
                return globalData
            }
            if (haveCachedData && !isMultiple) {
                setState({ ...initialState, data: cached })
                return cached
            }
            refetch()
        })()
    }, [key, ...dependency])

    return {
        loading,
        error,
        data,
    }
}
