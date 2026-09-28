import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import { useIsFocused } from 'expo-router';
import html from '../../tuner/components/mobileGuitarHtml.json';
import importedModels from '../../../assets/guitars/imported/models.json';
import type { GuitarDesign } from '../../progression/guitarDesigns';
import { guitarModel, isImportedGuitar, type GuitarModelId } from '../../progression/guitarModels';
import { Colors } from '../../../constants/Colors';
import { boundedThumbnails, readThumbnailCache, thumbnailKey, THUMBNAIL_STORAGE_KEY, validThumbnail, type ThumbnailEntries } from './thumbnailCache';

type Job = { key: string; modelId: GuitarModelId; design: GuitarDesign };
type ThumbnailContextValue = {
  images: ThumbnailEntries; failed: ReadonlySet<string>;
  request: (job: Job) => () => void;
  pause: () => () => void;
  reject: (key: string) => void;
};
const Context = createContext<ThumbnailContextValue | null>(null);
const source = { html };
let memory: ThumbnailEntries = {};
let writes = Promise.resolve();

/** One reusable renderer per collection; the cards themselves are native images. */
export function GuitarThumbnailProvider({ children }: { children: React.ReactNode }) {
  const focused = useIsFocused();
  const [images, setImages] = useState(memory);
  const [loaded, setLoaded] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const [pauses, setPauses] = useState(0);
  const [rendererVersion, setRendererVersion] = useState(0);
  const subscribers = useRef(new Map<string, number>());
  useEffect(() => {
    let live = true;
    AsyncStorage.getItem(THUMBNAIL_STORAGE_KEY).then(raw => {
      if (live) { memory = boundedThumbnails({ ...readThumbnailCache(raw), ...memory }); setImages(memory); }
    }).catch(() => {}).finally(() => { if (live) setLoaded(true); });
    return () => { live = false; };
  }, []);
  const request = useCallback((job: Job) => {
    subscribers.current.set(job.key, (subscribers.current.get(job.key) ?? 0) + 1);
    setJobs(old => old.some(item => item.key === job.key) ? old : [...old, job]);
    return () => {
      const count = (subscribers.current.get(job.key) ?? 1) - 1;
      if (count > 0) subscribers.current.set(job.key, count);
      else { subscribers.current.delete(job.key); setJobs(old => old.filter(item => item.key !== job.key)); }
    };
  }, []);
  const pause = useCallback(() => {
    setPauses(count => count + 1);
    return () => setPauses(count => Math.max(0, count - 1));
  }, []);
  const complete = useCallback((key: string, uri?: string) => {
    if (validThumbnail(uri)) {
      memory = boundedThumbnails({ ...memory, [key]: uri });
      setImages(old => ({ ...old, [key]: uri }));
      const value = JSON.stringify(memory);
      // Failed cache writes do not affect the user's saved guitars.
      writes = writes.then(() => AsyncStorage.setItem(THUMBNAIL_STORAGE_KEY, value)).catch(() => {});
    } else {
      // A corrupt persisted image must not leave a permanently blank card.
      delete memory[key];
      setImages(old => { const next = { ...old }; delete next[key]; return next; });
      const value = JSON.stringify(memory);
      writes = writes.then(() => AsyncStorage.setItem(THUMBNAIL_STORAGE_KEY, value)).catch(() => {});
      setFailed(old => new Set(old).add(key));
      setRendererVersion(version => version + 1);
    }
  }, []);
  const job = loaded && focused && pauses === 0 ? jobs.find(item => !images[item.key] && !failed.has(item.key)) : undefined;
  return <Context.Provider value={{ images, failed, request, pause, reject: complete }}>
    {children}
    {job && <View collapsable={false} pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.worker}>
      <ThumbnailRenderer key={rendererVersion} job={job} onComplete={complete} />
    </View>}
  </Context.Provider>;
}

/** Let interactive guitar details use the GPU while background pictures wait. */
export function usePauseThumbnails(paused: boolean) {
  const pause = useContext(Context)?.pause;
  useEffect(() => paused ? pause?.() : undefined, [pause, paused]);
}

function ThumbnailRenderer({ job, onComplete }: { job: Job; onComplete: (key: string, uri?: string) => void }) {
  const ref = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const current = useRef(job); current.current = job;
  useEffect(() => {
    if (!ready) return;
    const setup = isImportedGuitar(job.modelId)
      ? `window.setImportedAsset(${JSON.stringify(job.modelId)},${JSON.stringify(importedModels[job.modelId])});`
      : 'window.setImportedAsset(null,null);';
    ref.current?.injectJavaScript(`${setup}window.updateGuitar(${JSON.stringify({ modelId: job.modelId, design: job.design, highlightedString: null, requestKey: job.key, captureThumbnail: true })});true;`);
  }, [ready, job]);
  useEffect(() => { const timer = setTimeout(() => onComplete(job.key), 20000); return () => clearTimeout(timer); }, [job.key, onComplete]);
  return <WebView ref={ref} source={source} style={styles.web} originWhitelist={['*']} javaScriptEnabled
    scrollEnabled={false} bounces={false} domStorageEnabled={false} allowFileAccess={false}
    allowFileAccessFromFileURLs={false} allowUniversalAccessFromFileURLs={false} setSupportMultipleWindows={false}
    onShouldStartLoadWithRequest={request => request.url === 'about:blank'}
    onMessage={event => {
      try {
        const message = JSON.parse(event.nativeEvent.data);
        if (message.type === 'ready') setReady(true);
        if (message.type === 'rendered' && message.requestKey === current.current.key) onComplete(message.requestKey, message.thumbnail);
        if (message.type === 'error') onComplete(current.current.key);
      } catch { onComplete(current.current.key); }
    }} onError={() => onComplete(current.current.key)} onRenderProcessGone={() => onComplete(current.current.key)} />;
}

export default function GuitarThumbnail({ design, modelId }: { design: GuitarDesign; modelId: GuitarModelId }) {
  const context = useContext(Context);
  const request = context?.request;
  const key = thumbnailKey(modelId, design);
  useEffect(() => request?.({ key, modelId, design }), [request, key]); // key fully describes the immutable recipe
  const uri = context?.images[key];
  const label = `${guitarModel(modelId)?.name ?? 'Guitar'}${isImportedGuitar(modelId) ? '' : `, ${design.name}`}, rendered preview`;
  return <View style={styles.frame}>
    {uri ? <Image source={{ uri }} style={styles.image} resizeMode="contain" onError={() => context?.reject(key)} accessibilityLabel={label} /> : <>
      {!context?.failed.has(key) && <ActivityIndicator color={Colors.dark.muted} />}
      <Text style={styles.placeholder}>{context?.failed.has(key) ? 'Tap to preview in 3D' : 'Preparing preview…'}</Text>
    </>}
  </View>;
}
const styles = StyleSheet.create({
  frame: { width: '100%', height: 154, alignItems: 'center', justifyContent: 'center', backgroundColor: '#141522', borderRadius: 12, overflow: 'hidden', gap: 8 },
  image: { width: '100%', height: '100%' },
  placeholder: { color: Colors.dark.muted, fontSize: 12, textAlign: 'center' },
  worker: { position: 'absolute', width: 192, height: 256, left: 0, top: 0, opacity: 0 },
  web: { flex: 1 },
});
