import { NextRequest, NextResponse } from 'next/server';
import { dbClient } from '@/lib/db/client';
import { s3Client } from '@/lib/storage/s3';
import { randomUUID } from 'crypto';
import { loadConfig } from '@/lib/config';

let isInitialized = false;

async function ensureInitialized() {
  if (!isInitialized) {
    try {
      const config = loadConfig();
      // Initialize S3 client (database initialization commented out)
      s3Client.initialize(config.s3);
      // await dbClient.initialize(config.database);
      isInitialized = true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('already initialized')) {
        isInitialized = true;
      } else {
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
    
    // Store the text content in S3
    const contentKey = await s3Client.storeText(textId, content);

    // Save metadata to PostgreSQL - commented out for now
    // const result = await dbClient.query(
    //   'INSERT INTO text_entries (id, title, content_key, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
    //   [textId, title, contentKey, new Date()]
    // );

    return NextResponse.json({ 
      success: true,
      id: textId,
      title: title
    }, { status: 201 });

  } catch (err) {
    console.error('Error saving text:', err);
    return NextResponse.json({ error: 'Internal error, see logs' }, { status: 500 });
  }
}
