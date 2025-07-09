import { createServerClient } from '@/lib/supabase/server'
import { AgentManager } from './manager'

export async function initializeAgentSystem() {
  try {
    const supabase = createServerClient()
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
    
    // For now, we don't auto-create default agents
    // Companies will create agents as needed through the UI
    console.log(`Found ${companies.length} companies`)
    
    // Run any scheduled agents
    try {
      await manager.runScheduledAgents()
      console.log('Scheduled agents check completed')
    } catch (error) {
      const errorMessage = `Failed to run scheduled agents: ${error instanceof Error ? error.message : 'Unknown error'}`
      console.error(errorMessage)
      errors.push(errorMessage)
    }
    
    return { initialized: companies.length, errors }
  } catch (error) {
    console.error('Failed to initialize agent system:', error)
    throw error
  }
}