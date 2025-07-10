import type { Profile, Company } from '@/types';

export type UserPersona = 'streamliner' | 'navigator' | 'hub' | 'spring' | 'processor';

interface PersonaSignals {
  importVolume: number;
  accountAge: number;
  userCount: number;
  taskCompletionSpeed: number;
  featureUsage: string[];
  role: string;
  companySize: number;
}

export class PersonaDetector {
  static async detect(user: Profile, company: Company): Promise<UserPersona> {
    // First check if persona was already determined during onboarding
    if (typeof window !== 'undefined') {
      const storedPersona = localStorage.getItem('user-persona');
      if (storedPersona && ['streamliner', 'navigator', 'hub', 'spring', 'processor'].includes(storedPersona)) {
        return storedPersona as UserPersona;
      }
    }
    
    // Otherwise, gather signals for persona detection
    const signals = await this.gatherSignals(user, company);
    
    // Apply detection logic based on Water Philosophy personas
    return this.analyzeSignals(signals);
  }

  private static async gatherSignals(user: Profile, company: Company): Promise<PersonaSignals> {
    // Mock data - in production, these would come from real analytics
    const accountAgeInDays = Math.floor(
      (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      importVolume: this.estimateImportVolume(company),
      accountAge: accountAgeInDays,
      userCount: 1, // Would query actual user count
      taskCompletionSpeed: 2.5, // Average seconds per task
      featureUsage: ['upload', 'analytics', 'agents'],
      role: user.role || 'analyst',
      companySize: this.estimateCompanySize(company)
    };
  }

  private static analyzeSignals(signals: PersonaSignals): UserPersona {
    // Spring: New users with small import volumes
    if (signals.accountAge < 30 && signals.importVolume < 1000000) {
      return 'spring';
    }

    // Hub: Multiple entities or high user count
    if (signals.userCount > 5 || signals.companySize > 10000000) {
      return 'hub';
    }

    // Streamliner: Fast task completion, focus on speed
    if (signals.taskCompletionSpeed < 3 && signals.featureUsage.includes('upload')) {
      return 'streamliner';
    }

    // Navigator: Established users with complex needs
    if (signals.accountAge > 90 && signals.importVolume > 5000000) {
      return 'navigator';
    }

    // Processor: Manufacturing or production focus
    if (signals.role === 'operations' || signals.featureUsage.includes('production')) {
      return 'processor';
    }

    // Default to streamliner for optimal first experience
    return 'streamliner';
  }

  private static estimateImportVolume(company: Company): number {
    // Mock estimation based on company name/type
    const name = company.name.toLowerCase();
    
    if (name.includes('wholesale') || name.includes('distribution')) {
      return 5000000;
    }
    if (name.includes('manufacturing') || name.includes('production')) {
      return 10000000;
    }
    if (name.includes('retail') || name.includes('store')) {
      return 2000000;
    }
    
    return 1000000; // Default
  }

  private static estimateCompanySize(company: Company): number {
    // Mock estimation
    return 5000000; // $5M default
  }
}