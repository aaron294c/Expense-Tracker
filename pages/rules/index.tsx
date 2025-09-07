// /pages/rules/index.tsx
import { GetServerSideProps } from 'next'
import { useState } from 'react'
import Layout from '@/components/Layout'
import { requireHousehold } from '@/lib/auth'
import { useRules } from '@/hooks/useRules'

interface RulesPageProps {
  householdId: string
  categories: any[]
}

export default function RulesPage({ householdId, categories }: RulesPageProps) {
  const { 
    rules, 
    isLoading, 
    error, 
    createRule, 
    deleteRule,
    getRulesByPriority 
  } = useRules(householdId)

  const [showAddForm, setShowAddForm] = useState(false)
  const [newRule, setNewRule] = useState({
    match_type: 'merchant_contains' as const,
    match_value: '',
    category_id: '',
    priority: 100
  })

  const getMatchTypeLabel = (matchType: string) => {
    switch (matchType) {
      case 'merchant_exact': return 'Merchant exactly matches'
      case 'merchant_contains': return 'Merchant contains'
      case 'description_contains': return 'Description contains'
      default: return matchType
    }
  }

  const getMatchTypeDescription = (matchType: string) => {
    switch (matchType) {
      case 'merchant_exact': return 'Transaction merchant must exactly match the rule value'
      case 'merchant_contains': return 'Transaction merchant must contain the rule value'
      case 'description_contains': return 'Transaction description must contain the rule value'
      default: return ''
    }
  }

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newRule.match_value.trim() || !newRule.category_id) {
      return
    }

    const rule = await createRule({
      household_id: householdId,
      ...newRule,
      match_value: newRule.match_value.trim()
    })

    if (rule) {
      setShowAddForm(false)
      setNewRule({
        match_type: 'merchant_contains',
        match_value: '',
        category_id: '',
        priority: 100
      })
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      await deleteRule(ruleId)
    }
  }

  const sortedRules = getRulesByPriority()

  if (error) {
    return (
      <Layout title="Rules - Expense Tracker">
        <div className="p-4">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Auto-categorization Rules - Expense Tracker">
      <div className="p-4 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Auto-categorization Rules</h1>
            <p className="text-gray-600 mt-1">
              Automatically categorize transactions based on merchant or description
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <span className="material-symbols-outlined">add</span>
            Add Rule
          </button>
        </header>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-blue-600 mt-0.5">info</span>
            <div>
              <h3 className="font-semibold text-blue-900">How Auto-categorization Works</h3>
              <p className="text-sm text-blue-800 mt-1">
                Rules are applied in order of priority (lower numbers = higher priority). 
                When a new transaction is created, the first matching rule will automatically assign the category.
              </p>
            </div>
          </div>
        </div>

        {/* Add Rule Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Rule</h3>
            
            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Match Type
                </label>
                <select
                  value={newRule.match_type}
                  onChange={(e) => setNewRule(prev => ({ ...prev, match_type: e.target.value as any }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="merchant_contains">Merchant Contains</option>
                  <option value="merchant_exact">Merchant Exactly Matches</option>
                  <option value="description_contains">Description Contains</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {getMatchTypeDescription(newRule.match_type)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Match Value
                </label>
                <input
                  type="text"
                  value={newRule.match_value}
                  onChange={(e) => setNewRule(prev => ({ ...prev, match_value: e.target.value }))}
                  required
                  placeholder={
                    newRule.match_type === 'merchant_contains' ? 'e.g., Starbucks' :
                    newRule.match_type === 'merchant_exact' ? 'e.g., STARBUCKS STORE #1234' :
                    'e.g., coffee'
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={newRule.category_id}
                  onChange={(e) => setNewRule(prev => ({ ...prev, category_id: e.target.value }))}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name} ({category.kind})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={newRule.priority}
                  onChange={(e) => setNewRule(prev => ({ ...prev, priority: parseInt(e.target.value) || 100 }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lower numbers = higher priority. Rules with priority 1-50 will be checked first.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Rule
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Rules List */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading rules...</p>
          </div>
        ) : sortedRules.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Active Rules ({sortedRules.length})
            </h3>
            
            {sortedRules.map((rule, index) => (
              <div key={rule.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                    <span className="text-sm font-bold text-gray-600">
                      {rule.priority}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getMatchTypeLabel(rule.match_type)}
                      </span>
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        "{rule.match_value}"
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-gray-600 text-sm">
                        {rule.categories.icon || 'category'}
                      </span>
                      <span className="text-sm text-gray-600">
                        → <span className="font-medium">{rule.categories.name}</span>
                      </span>
                      <span className="text-xs text-gray-400">
                        ({rule.categories.kind})
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-gray-400 text-6xl mb-4">
              auto_awesome
            </span>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No auto-categorization rules
            </h3>
            <p className="text-gray-500 mb-4">
              Create rules to automatically categorize your transactions
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined">add</span>
              Add Your First Rule
            </button>
          </div>
        )}

        {/* Help Section */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Rule Examples</h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span className="font-medium">Merchant Contains "Starbucks"</span>
              <span className="text-gray-600">→ Dining Out</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="font-medium">Description Contains "gas"</span>
              <span className="text-gray-600">→ Transportation</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              <span className="font-medium">Merchant Exactly "AMAZON.COM"</span>
              <span className="text-gray-600">→ Shopping</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Pro tip:</span> Start with broader "contains" rules, 
              then add specific "exact" rules with higher priority for exceptions.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps = requireHousehold(
  async (context, { household, supabase }) => {
    // Get categories for rule creation
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, kind, icon')
      .eq('household_id', household.id)
      .order('kind', { ascending: false })
      .order('name')

    return {
      props: {
        householdId: household.id,
        categories: categories || [],
      },
    }
  }
)