'use client'
import { useState, useEffect } from 'react'
import { vehicleTypesApi } from '@/lib/api'
import type { VehicleType } from '@/types'

export function useVehicleTypes() {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchVehicleTypes = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await vehicleTypesApi.list({ active_only: true })
      setVehicleTypes(response.data)
    } catch (err: any) {
      console.error('Failed to fetch vehicle types:', err)
      setError(err.response?.data?.detail || 'Failed to load vehicle types')
    } finally {
      setLoading(false)
    }
  }

  const getVehicleTypeOptions = () => {
    return vehicleTypes.map(type => ({
      value: type.code,
      label: type.name_hebrew || type.name,
      description: type.description
    }))
  }

  const getVehicleTypeLabel = (code: string) => {
    const type = vehicleTypes.find(t => t.code === code)
    return type ? (type.name_hebrew || type.name) : code
  }

  const getVehicleTypeDescription = (code: string) => {
    const type = vehicleTypes.find(t => t.code === code)
    return type?.description || ''
  }

  useEffect(() => {
    fetchVehicleTypes()
  }, [])

  return {
    vehicleTypes,
    loading,
    error,
    getVehicleTypeOptions,
    getVehicleTypeLabel,
    getVehicleTypeDescription,
    refetch: fetchVehicleTypes
  }
}