import { createClient } from '@/lib/supabase/server'
import { createDefaultAgents } from './factory'
import { AgentManager } from './manager'

export async function initializeAgentSystem() {
  try {
    const supabase = createClient()
    const manager = AgentManager.getInstance()
    
    // Get all companies
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id')
    
    if (companiesError) {
      throw new Error(`Failed to fetch companies: ${companiesError.message}`)
    }
    
    if (!companies || companies.length === 0) {
      console.log('No companies found to initialize agents for')
      return { initialized: 0, errors: [] }
    }
    
    let initialized = 0
    const errors: string[] = []
    
    // Initialize default agents for each company
    for (const company of companies) {
      try {
        await createDefaultAgents(company.id)
        initialized++
      } catch (error) {
        const errorMessage = `Failed to initialize agents for company ${company.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        console.error(errorMessage)
        errors.push(errorMessage)
      }
    }
    
    // Start all agents
    await manager.startAllAgents()
    
    return { initialized, errors }
  } catch (error) {
    console.error('Failed to initialize agent system:', error)
    throw error
  }
}