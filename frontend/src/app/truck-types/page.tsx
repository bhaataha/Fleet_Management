'use client'
import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { vehicleTypesApi } from '@/lib/api'
import { Truck, Plus, Edit, Trash2, Settings } from 'lucide-react'

interface VehicleType {
  id: number
  name: string
  name_hebrew?: string
  description?: string
  code: string
  is_active: boolean
  sort_order: number
  is_system_default: boolean
  created_at: string
  updated_at?: string
}

interface VehicleTypeFormData {
  name: string
  name_hebrew: string
  description: string
  code: string
  sort_order: number
}

export default function VehicleTypesPage() {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<VehicleType | null>(null)
  const [formData, setFormData] = useState<VehicleTypeFormData>({
    name: '',
    name_hebrew: '',
    description: '',
    code: '',
    sort_order: 0
  })

  useEffect(() => {
    fetchVehicleTypes()
  }, [])

  const fetchVehicleTypes = async () => {
    try {
      setLoading(true)
      const response = await vehicleTypesApi.list({ active_only: false })
      setVehicleTypes(response.data)
    } catch (error) {
      console.error('Failed to fetch vehicle types:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSeedDefaults = async () => {
    try {
      const response = await vehicleTypesApi.seedDefaults()
      alert(`נוספו ${response.data.seeded} סוגי רכב ברירת מחדל`)
      fetchVehicleTypes()
    } catch (error) {
      console.error('Failed to seed defaults:', error)
      alert('שגיאה בהוספת ברירת מחדל')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.code) {
      alert('שם וקוד הם שדות חובה')
      return
    }

    try {
      if (editingType) {
        await vehicleTypesApi.update(editingType.id, formData)
        alert('סוג הרכב עודכן בהצלחה')
      } else {
        await vehicleTypesApi.create(formData)
        alert('סוג הרכב נוצר בהצלחה')
      }
      
      setIsCreateDialogOpen(false)
      setEditingType(null)
      resetForm()
      fetchVehicleTypes()
    } catch (error: any) {
      console.error('Failed to save vehicle type:', error)
      const errorMessage = error.response?.data?.detail || 'שגיאה בשמירה'
      alert(errorMessage)
    }
  }

  const handleEdit = (vehicleType: VehicleType) => {
    setEditingType(vehicleType)
    setFormData({
      name: vehicleType.name,
      name_hebrew: vehicleType.name_hebrew || '',
      description: vehicleType.description || '',
      code: vehicleType.code,
      sort_order: vehicleType.sort_order
    })
    setIsCreateDialogOpen(true)
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את סוג הרכב "${name}"?`)) {
      return
    }

    try {
      await vehicleTypesApi.delete(id)
      alert('סוג הרכב נמחק בהצלחה')
      fetchVehicleTypes()
    } catch (error: any) {
      console.error('Failed to delete vehicle type:', error)
      const errorMessage = error.response?.data?.detail || 'שגיאה במחיקה'
      alert(errorMessage)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      name_hebrew: '',
      description: '',
      code: '',
      sort_order: 0
    })
  }

  const handleDialogClose = (open: boolean) => {
    setIsCreateDialogOpen(open)
    if (!open) {
      setEditingType(null)
      resetForm()
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">טוען סוגי רכב...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-6 h-6" />
            ניהול סוגי רכב
          </h1>
          <p className="text-gray-600 mt-1">
            הגדר סוגי רכב מותאמים לחברתך
          </p>
        </div>
        
        <div className="flex gap-2">
          {vehicleTypes.length === 0 && (
            <Button
              onClick={handleSeedDefaults}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              הוסף ברירת מחדל
            </Button>
          )}
          
          <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                סוג רכב חדש
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingType ? 'עריכת סוג רכב' : 'סוג רכב חדש'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">שם *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="פול טריילר"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="name_hebrew">שם בעברית</Label>
                  <Input
                    id="name_hebrew"
                    value={formData.name_hebrew}
                    onChange={(e) => setFormData(prev => ({ ...prev, name_hebrew: e.target.value }))}
                    placeholder="פול טריילר"
                  />
                </div>
                
                <div>
                  <Label htmlFor="code">קוד *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="FULL_TRAILER"
                    style={{ textTransform: 'uppercase' }}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">תיאור</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="משאית עם נגרר מלא"
                    rows={2}
                  />
                </div>
                
                <div>
                  <Label htmlFor="sort_order">סדר תצוגה</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                    min="0"
                  />
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDialogClose(false)}
                  >
                    ביטול
                  </Button>
                  <Button type="submit">
                    {editingType ? 'עדכן' : 'צור'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Vehicle Types Grid */}
      {vehicleTypes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Truck className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">אין סוגי רכב</h3>
            <p className="text-gray-500 text-center mb-4">
              התחל בהוספת סוגי רכב לחברתך או השתמש בברירת המחדל
            </p>
            <Button onClick={handleSeedDefaults} variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              הוסף ברירת מחדל
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicleTypes.map((vehicleType) => (
            <Card key={vehicleType.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {vehicleType.name_hebrew || vehicleType.name}
                      {vehicleType.is_system_default && (
                        <Badge variant="secondary" className="text-xs">
                          ברירת מחדל
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {vehicleType.code}
                      </code>
                      <Badge 
                        variant={vehicleType.is_active ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {vehicleType.is_active ? 'פעיל' : 'לא פעיל'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(vehicleType)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(vehicleType.id, vehicleType.name)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {vehicleType.description && (
                <CardContent>
                  <p className="text-sm text-gray-600">
                    {vehicleType.description}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-6 h-6" />
            ניהול סוגי רכב
          </h1>
          <p className="text-gray-600 mt-1">
            הגדר סוגי רכב מותאמים לחברתך
          </p>
        </div>
        
        <div className="flex gap-2">
          {vehicleTypes.length === 0 && (
            <Button
              onClick={handleSeedDefaults}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              הוסף ברירת מחדל
            </Button>
          )}
          
          <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                סוג רכב חדש
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingType ? 'עריכת סוג רכב' : 'סוג רכב חדש'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">שם *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="פול טריילר"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="name_hebrew">שם בעברית</Label>
                  <Input
                    id="name_hebrew"
                    value={formData.name_hebrew}
                    onChange={(e) => setFormData(prev => ({ ...prev, name_hebrew: e.target.value }))}
                    placeholder="פול טריילר"
                  />
                </div>
                
                <div>
                  <Label htmlFor="code">קוד *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="FULL_TRAILER"
                    style={{ textTransform: 'uppercase' }}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">תיאור</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="משאית עם נגרר מלא"
                    rows={2}
                  />
                </div>
                
                <div>
                  <Label htmlFor="sort_order">סדר תצוגה</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                    min="0"
                  />
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDialogClose(false)}
                  >
                    ביטול
                  </Button>
                  <Button type="submit">
                    {editingType ? 'עדכן' : 'צור'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Vehicle Types Grid */}
      {vehicleTypes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Truck className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">אין סוגי רכב</h3>
            <p className="text-gray-500 text-center mb-4">
              התחל בהוספת סוגי רכב לחברתך או השתמש בברירת המחדל
            </p>
            <Button onClick={handleSeedDefaults} variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              הוסף ברירת מחדל
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicleTypes.map((vehicleType) => (
            <Card key={vehicleType.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {vehicleType.name_hebrew || vehicleType.name}
                      {vehicleType.is_system_default && (
                        <Badge variant="secondary" className="text-xs">
                          ברירת מחדל
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {vehicleType.code}
                      </code>
                      <Badge 
                        variant={vehicleType.is_active ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {vehicleType.is_active ? 'פעיל' : 'לא פעיל'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(vehicleType)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(vehicleType.id, vehicleType.name)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {vehicleType.description && (
                <CardContent>
                  <p className="text-sm text-gray-600">
                    {vehicleType.description}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
                <p className="text-sm font-medium text-gray-600">הכי נפוץ</p>
                <p className="text-lg font-bold text-gray-900">סמי טריילר</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Info className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Truck Types List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">רשימת סוגי הרכב</h2>
            <p className="text-sm text-gray-600 mt-1">לחץ על סוג רכב לראות פרטים נוספים</p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {TRUCK_TYPES.map((type, index) => (
              <div
                key={type.value}
                className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedType === type.value ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                }`}
                onClick={() => setSelectedType(selectedType === type.value ? null : type.value)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Truck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{type.label}</h3>
                      <p className="text-sm text-gray-600">{type.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          קוד: {type.value}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">#{index + 1}</span>
                  </div>
                </div>
                
                {/* Expanded Details */}
                {selectedType === type.value && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">פרטים טכניים:</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">שם באנגלית:</span>
                        <span className="text-gray-600 mr-2">{type.value.replace(/_/g, ' ')}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">קטגוריה:</span>
                        <span className="text-gray-600 mr-2">
                          {type.value.includes('TRAILER') ? 'טריילר' : 
                           type.value.includes('TRUCK') ? 'משאית' : 'רכב מסחרי'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                      <h5 className="font-medium text-blue-800 mb-1">התאמות מומלצות:</h5>
                      <p className="text-sm text-blue-700">
                        {type.value === 'FULL_TRAILER' && 'מתאים להובלות כבדות למרחקים ארוכים, קיבולת גבוהה'}
                        {type.value === 'SEMI_TRAILER' && 'הכי נפוץ בענף ההובלות, גמיש ויעיל'}
                        {type.value === 'DOUBLE_TRAILER' && 'מתאים לנפחים גדולים, דרוש רישיון מיוחד'}
                        {type.value === 'SMALL_TRUCK' && 'מתאים לעבודות קטנות ובשטח עירוני'}
                        {type.value === 'PICKUP' && 'לעבודות קלות ושירותי חירום'}
                        {type.value === 'CONCRETE_MIXER' && 'ייעודי לאספקת בטון רענן'}
                        {type.value === 'DUMP_TRUCK' && 'מתאים לפינוי חומרים ופסולת בניין'}
                        {type.value === 'FLATBED' && 'לחומרים מיוחדים וציוד כבד'}
                        {type.value === 'OTHER' && 'לסוגי רכב מיוחדים שאינם מוגדרים'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center">
          <div className="bg-gray-50 p-6 rounded-lg text-center">
            <Info className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">הערה חשובה</h3>
            <p className="text-sm text-gray-600">
              סוגי הרכב מוגדרים במערכת ולא ניתנים לעריכה בממשק. 
              <br />
              לשינויים נוספים, פנה למפתח המערכת.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}