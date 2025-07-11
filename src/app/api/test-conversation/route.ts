import { NextRequest, NextResponse } from 'next/server';
import { getIntelligentConversationService } from '@/lib/whatsapp/intelligent-conversation-service';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, messages } = await request.json();

    if (!phoneNumber || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'phoneNumber and messages array required' },
        { status: 400 }
      );
    }

    console.log('🧪 Testing conversation simulation:', {
      phoneNumber,
      messageCount: messages.length
    });

    const intelligentService = getIntelligentConversationService();
    
    // Run the simulation
    const results = await intelligentService.simulateConversation(phoneNumber, messages);
    
    // Get conversation analytics
    const analytics = await intelligentService.getConversationAnalytics(phoneNumber);
    
    // Get system stats
    const systemStats = await intelligentService.getSystemStats();

    return NextResponse.json({
      success: true,
      results,
      analytics,
      systemStats,
      summary: {
        phoneNumber,
        messagesProcessed: messages.length,
        responsesGenerated: results.length,
        persona: analytics.persona,
        totalConversations: analytics.totalMessages
      }
    });

  } catch (error) {
    console.error('Conversation simulation error:', error);
    return NextResponse.json(
      { error: 'Simulation failed', details: error.message },
      { status: 500 }
    );
  }
}