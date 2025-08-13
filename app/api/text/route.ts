import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { s3Client } from '@/lib/storage/s3';
import { loadConfig } from '@/lib/config';

let isInitialized = false;

async function ensureInitialized() {
  if (!isInitialized) {
    try {
      const config = loadConfig();
      s3Client.initialize(config.s3);
      isInitialized = true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('already initialized')) {
        isInitialized = true;
      } else {
        console.error('S3 initialization error:', error);
        throw error;
      }
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureInitialized();

    const formData = await req.formData();
    const title = formData.get('title')?.toString();
    const content = formData.get('content')?.toString();

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    // Generate a unique ID for the text file
    const textId = randomUUID();
    
    try {
      // Store the text content in S3
      const contentKey = await s3Client.storeText(textId, content);

      return NextResponse.json({ 
        success: true,
        id: textId,
        title: title,
        contentKey: contentKey // Adding this to help with debugging
      }, { status: 201 });
    } catch (s3Error) {
      console.error('S3 storage error:', s3Error);
      return NextResponse.json({ 
        error: 'Failed to store content in S3',
        details: s3Error instanceof Error ? s3Error.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (err) {
    console.error('Request processing error:', err);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}
