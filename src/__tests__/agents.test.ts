import { AgentFactory } from '@/lib/agents/factory'
import { Agent, AgentType } from '@/lib/agents/types'

describe('AgentFactory', () => {
  let factory: AgentFactory

  beforeEach(() => {
    factory = AgentFactory.getInstance()
  })

  describe('createAgent', () => {
    it('should create an inventory monitor agent', () => {
      const agentConfig: Agent = {
        id: 'test-1',
        company_id: 'company-1',
        name: 'Test Inventory Monitor',
        type: 'inventory_monitor' as AgentType,
        status: 'active',
        config: {
          thresholds: { low: 100, critical: 50 },
          checkInterval: 5
        },
        created_at: new Date(),
        updated_at: new Date()
      }

      const agent = factory.createAgent(agentConfig)
      expect(agent).toBeDefined()
      expect(agent.getName()).toBe('Test Inventory Monitor')
    })

    it('should create an alert generator agent', () => {
      const agentConfig: Agent = {
        id: 'test-2',
        company_id: 'company-1',
        name: 'Test Alert Generator',
        type: 'alert_generator' as AgentType,
        status: 'active',
        config: {
          alertTypes: ['inventory_low', 'order_delayed'],
          recipients: ['admin@example.com'],
          priority: 'high',
          cooldownPeriod: 60
        },
        created_at: new Date(),
        updated_at: new Date()
      }

      const agent = factory.createAgent(agentConfig)
      expect(agent).toBeDefined()
      expect(agent.getName()).toBe('Test Alert Generator')
    })

    it('should create a data processor agent', () => {
      const agentConfig: Agent = {
        id: 'test-3',
        company_id: 'company-1',
        name: 'Test Data Processor',
        type: 'data_processor' as AgentType,
        status: 'active',
        config: {
          source: 's3://bucket/input',
          format: 'csv',
          transformations: [],
          destination: 's3://bucket/output'
        },
        created_at: new Date(),
        updated_at: new Date()
      }

      const agent = factory.createAgent(agentConfig)
      expect(agent).toBeDefined()
      expect(agent.getName()).toBe('Test Data Processor')
    })

    it('should throw error for invalid agent type', () => {
      const agentConfig: any = {
        id: 'test-4',
        company_id: 'company-1',
        name: 'Invalid Agent',
        type: 'invalid_type',
        status: 'active',
        config: {},
        created_at: new Date(),
        updated_at: new Date()
      }

      expect(() => factory.createAgent(agentConfig)).toThrow('Unknown agent type: invalid_type')
    })
  })

  describe('validateConfig', () => {
    it('should validate inventory monitor config', () => {
      const validConfig = {
        thresholds: { low: 100, critical: 50 },
        checkInterval: 5
      }

      expect(factory.validateConfig('inventory_monitor' as AgentType, validConfig)).toBe(true)
    })

    it('should reject invalid inventory monitor config', () => {
      const invalidConfig = {
        thresholds: { low: 100 }, // missing critical
        checkInterval: 5
      }

      expect(factory.validateConfig('inventory_monitor' as AgentType, invalidConfig)).toBe(false)
    })

    it('should validate alert generator config', () => {
      const validConfig = {
        alertTypes: ['inventory_low'],
        recipients: ['admin@example.com'],
        priority: 'high',
        cooldownPeriod: 60
      }

      expect(factory.validateConfig('alert_generator' as AgentType, validConfig)).toBe(true)
    })

    it('should reject invalid alert generator config', () => {
      const invalidConfig = {
        alertTypes: [], // empty alertTypes
        recipients: ['admin@example.com'],
        priority: 'high',
        cooldownPeriod: 60
      }

      expect(factory.validateConfig('alert_generator' as AgentType, invalidConfig)).toBe(false)
    })
  })
})