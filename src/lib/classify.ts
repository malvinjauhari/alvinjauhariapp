import { GoogleGenAI } from '@google/genai';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

interface ClassifyResult {
  status: 'success' | 'error';
  detectedType?: string;
  savedCollection?: string;
  data?: any;
  ids?: string[];
  id?: string;
  count?: number;
  message?: string;
}

export async function classifyInput(uid: string, input: string, source: string): Promise<ClassifyResult> {
  if (!uid || !input) {
    return { status: 'error', message: 'Missing uid or input.' };
  }

  const rawInput = input.trim();
  let classification: any = null;
  let usedAI = false;

  const urlRegex = /(?:https?:\/\/)?(?:www\.)?(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?/gi;
  const urlMatches = rawInput.match(urlRegex);
  const lowerInput = rawInput.toLowerCase();

  let linkItems: Array<{ url: string; description: string }> = [];
  if (urlMatches && urlMatches.length > 0) {
    const parts = rawInput.split(/[\n,]+/).map(p => p.trim()).filter(Boolean);
    parts.forEach(part => {
      const partUrls = part.match(urlRegex) || [];
      if (partUrls.length === 1) {
        const url = partUrls[0];
        const desc = part.replace(url, '').trim();
        linkItems.push({ url, description: desc });
      } else if (partUrls.length > 1) {
        partUrls.forEach(url => {
          linkItems.push({ url, description: '' });
        });
      } else {
        if (linkItems.length > 0) {
          linkItems[linkItems.length - 1].description += (linkItems[linkItems.length - 1].description ? ' ' : '') + part;
        }
      }
    });

    linkItems = linkItems.map(item => ({
      ...item,
      url: /^https?:\/\//i.test(item.url) ? item.url : `https://${item.url}`
    }));
  }

  if (linkItems.length > 0) {
    classification = {
      type: 'link',
      confidence: 1.0,
      data: {
        items: linkItems.map(li => {
          let hostname = 'Saved Link';
          try { hostname = new URL(li.url).hostname; } catch (e) {}
          return {
            url: li.url,
            description: li.description || '',
            title: hostname,
            categoryName: 'General'
          };
        })
      }
    };
  } else if (
    lowerInput.startsWith('catatan:') || lowerInput.startsWith('note:') ||
    lowerInput.startsWith('ide besar:') || lowerInput.startsWith('konsep:') ||
    lowerInput.startsWith('ide:') || lowerInput.startsWith('rangkuman:') ||
    lowerInput.startsWith('materi:') || lowerInput.startsWith('penjelasan:') ||
    lowerInput.startsWith('planning:') || lowerInput.startsWith('draft:') ||
    lowerInput.startsWith('outline:')
  ) {
    classification = {
      type: 'note',
      confidence: 1.0,
      data: {
        title: rawInput.split('\n')[0].replace(/^(catatan|note|ide besar|konsep|ide|rangkuman|materi|penjelasan|planning|draft|outline):\s*/i, '').trim() || 'Untitled Note',
        content: rawInput
      }
    };
  } else {
    const taskKeywords = ['buat', 'kerjakan', 'selesaikan', 'fix', 'perbaiki', 'cek', 'review', 'update', 'implementasikan', 'tambahkan', 'hapus', 'ubah', 'deploy', 'belajar', 'ingatkan', 'nanti', 'besok', 'minggu ini', 'create', 'build', 'implement', 'add', 'remove', 'delete', 'learn', 'remind', 'tomorrow', 'later', 'bikin', 'meeting', 'rapat', 'cuci', 'lari', 'olahraga', 'beli', 'bayar', 'kirim', 'hubungi', 'telepon', 'follow up', 'call', 'send', 'pay', 'clean', 'run', 'exercise'];

    let looksLikeTask = false;
    let isCommaList = false;
    let checklistItems: any[] = [];

    if (rawInput.includes(',')) {
      const parts = rawInput.split(',').map(s => s.trim()).filter(Boolean);
      if (parts.length >= 2) {
        let taskWordCount = 0;
        parts.forEach(part => {
          const pl = part.toLowerCase();
          if (taskKeywords.some(kw => pl.includes(kw) || pl.split(/\s+/).includes(kw))) {
            taskWordCount++;
          }
        });
        if (taskWordCount > 0) {
          looksLikeTask = true;
          isCommaList = true;
          checklistItems = parts.map((p, i) => ({
            id: Date.now().toString() + '-' + i,
            text: p.charAt(0).toUpperCase() + p.slice(1),
            completed: false
          }));
        }
      }
    }

    if (!looksLikeTask) {
      const firstWord = lowerInput.split(' ')[0].replace(/[^a-z]/g, '');
      if (taskKeywords.includes(firstWord) || (rawInput.length < 150 && taskKeywords.some(kw => lowerInput.includes(kw)))) {
        looksLikeTask = true;
      }
    }

    if (looksLikeTask) {
      classification = {
        type: 'temporary_note',
        confidence: 0.9,
        data: {
          content: `[Task Idea] ${rawInput}\n\n(Saved as Quick Note. You can convert it to Task manually.)`
        }
      };
    } else {
      const lines = rawInput.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length >= 2 && lines[0].length < 100) {
        classification = {
          type: 'note',
          confidence: 0.9,
          data: {
            title: lines[0],
            content: lines.slice(1).join('\n')
          }
        };
      }
    }
  }

  if (!classification) {
    usedAI = true;
    const prompt = `
You are a strict classification engine for Aljauhari App.
Classify the user's raw input into exactly one of:
* link
* note
* temporary_note
* mixed
* unknown

Definitions:
link: Use if the input contains a URL or primarily saves an external resource.
note: Use if the input is structured, explanatory, long-form, or reusable knowledge.
temporary_note: Use if the input is short, rough, unclear, incomplete, or looks like an action/task (tasks must be manual).
mixed: Use only if there are multiple distinct items that should be saved separately.
unknown: Use only if classification is impossible.

Rules:
* If input sounds like an action or todo list, classify as temporary_note and prepend "[Task Idea] ".
* If unsure, use temporary_note.
* Never lose the original input.
* Do not invent URLs.
* Do not hallucinate facts.
* Return JSON only.
* Use Indonesian understanding naturally because the user often writes in Indonesian slang.

Required JSON format:
{
"type": "link | note | temporary_note | mixed | unknown",
"confidence": 0.0,
"reason": "short reason",
"data": {}
}

For link data: { "title": "", "url": "", "description": "", "categoryName": "" }
For note data: { "title": "", "content": "", "categoryName": "" }
For temporary_note data: { "content": "" }

Input to classify:
"${rawInput}"
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });
      classification = JSON.parse(response.text || '{}');
    } catch (e) {
      classification = null;
    }
  }

  if (!classification || typeof classification !== 'object') {
    classification = { type: 'temporary_note', confidence: 0, data: { content: rawInput } };
  }

  if (usedAI) {
    if (classification.confidence < 0.7) {
      classification = { type: 'temporary_note', confidence: classification.confidence, data: { content: rawInput } };
    }
    if (urlMatches && urlMatches.length > 0 && classification.type !== 'mixed') {
      classification.type = 'link';
      classification.data.url = classification.data.url || urlMatches[0];
    }
    if (!['link', 'note', 'temporary_note'].includes(classification.type)) {
      classification.type = 'temporary_note';
      if (!classification.data?.content && !classification.data?.description) {
        classification.data = { content: rawInput };
      }
    }
  }

  if (classification.type === 'link' && !classification.data.items && !classification.data.url) {
    classification.type = 'temporary_note';
    classification.data = { content: rawInput };
  }
  if (classification.type === 'note' && !classification.data.content) {
    classification.data.content = rawInput;
  }

  const type = classification.type || 'temporary_note';

  if (type === 'link') {
    const _items = classification.data.items || [{
      url: classification.data.url,
      description: classification.data.description,
      title: classification.data.title,
      categoryName: classification.data.categoryName
    }];

    const promises = _items.map(async (item: any) => {
      let urlToSave = item.url || rawInput;
      urlToSave = /^https?:\/\//i.test(urlToSave) ? urlToSave : `https://${urlToSave}`;

      const payload = {
        source,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        userId: uid,
        aiConfidence: classification.confidence || 1.0,
        title: item.title || 'Saved Link',
        url: urlToSave,
        description: item.description || '',
        category: item.categoryName || 'General'
      };
      const docRef = await addDoc(collection(db, 'users', uid, 'links'), payload);
      return { id: docRef.id, ...payload };
    });

    const savedItems = await Promise.all(promises);

    await addDoc(collection(db, 'users', uid, 'captureHistory'), {
      userId: uid,
      rawInput,
      source,
      detectedType: 'link',
      savedCollection: 'links',
      savedItemIds: savedItems.map(si => si.id),
      itemCount: savedItems.length,
      aiConfidence: classification.confidence || 1.0,
      status: 'success',
      createdAt: serverTimestamp()
    });

    return {
      status: 'success',
      detectedType: 'link',
      savedCollection: 'links',
      data: classification.data,
      ids: savedItems.map(si => si.id),
      count: savedItems.length
    };
  }

  let collectionName = 'temporaryNotes';

  const payload: any = {
    source,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    userId: uid,
    aiConfidence: classification.confidence || 1.0
  };

  if (type === 'note') {
    collectionName = 'notes';
    payload.title = classification.data?.title || 'Untitled Note';
    payload.content = classification.data?.content || rawInput;
    payload.category = classification.data?.categoryName || 'General';
  } else {
    collectionName = 'temporaryNotes';
    payload.content = classification.data?.content || rawInput;
    payload.status = 'active';
  }

  const docRef = await addDoc(collection(db, 'users', uid, collectionName), payload);

  await addDoc(collection(db, 'users', uid, 'captureHistory'), {
    userId: uid,
    rawInput,
    source,
    detectedType: type,
    savedCollection: collectionName,
    savedItemId: docRef.id,
    aiConfidence: payload.aiConfidence,
    status: 'success',
    createdAt: serverTimestamp()
  });

  return {
    status: 'success',
    detectedType: type,
    savedCollection: collectionName,
    data: classification.data,
    id: docRef.id
  };
}
