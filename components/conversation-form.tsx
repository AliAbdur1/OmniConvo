'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function ConversationForm() {
  const formRef = React.useRef<HTMLFormElement>(null);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      const response = await fetch('/api/text', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to save text');
      const data = await response.json();
      alert('Text saved successfully!');
      formRef.current?.reset();
    } catch (error) {
      console.error('Error saving text:', error);
      alert('Failed to save text');
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className='max-w-xl mx-auto space-y-4'>
      <Input
        type='text'
        name='title'
        placeholder='Enter a title for your text'
        required
        className='w-full'
      />
      <Textarea
        name='content'
        placeholder='Enter your text here...'
        required
        className='w-full min-h-[200px]'
      />
      <Button type='submit' className='w-full'>Save Text</Button>
    </form>
  );
}
