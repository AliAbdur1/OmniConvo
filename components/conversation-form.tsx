'use client';

import React, { useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export function ConversationForm() {
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch('/api/text', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to save text');
      }

      const data = await response.json();
      console.log('Text saved successfully:', data);
      formRef.current?.reset();
    } catch (error) {
      console.error('Error saving text:', error);
    }
  }

  return (
    <form onSubmit={handleSubmit} ref={formRef} className="space-y-4">
      <Input
        type="text"
        name="title"
        placeholder="Enter title"
        required
        className="w-full"
      />
      <Textarea
        name="content"
        placeholder="Enter your text content"
        required
        className="w-full min-h-[200px]"
      />
      <Button type="submit" className="w-full">
        Submit
      </Button>
    </form>
  );
}
