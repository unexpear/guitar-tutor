import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useIsFocused } from 'expo-router';
import html from './mobileGuitarHtml.json';
import type { GuitarDesign } from '../../progression/guitarDesigns';
import type { GuitarModelId } from '../../progression/guitarModels';
import {isImportedGuitar} from '../../progression/guitarModels';
import importedModels from '../../../assets/guitars/imported/models.json';
import FullGuitarSvg from '../../games/locker/FullGuitarSvg';

const source={html};
type Props={design:GuitarDesign;modelId:GuitarModelId;highlightedString?:number;mirrored?:boolean};
export default function Guitar3D(props:Props) {
  const key=JSON.stringify([props.modelId,isImportedGuitar(props.modelId)?null:props.design]);
  return <GuitarScene key={key} {...props} />;
}
function GuitarScene({design,modelId,highlightedString,mirrored}:Props) {
  const focused=useIsFocused();
  const ref=useRef<WebView>(null);
  const sentModel=useRef<string|null>(null);
  const [ready,setReady]=useState(false),[failed,setFailed]=useState(false);
  const [renderedKey,setRenderedKey]=useState<string|null>(null);
  const [sceneHeight,setSceneHeight]=useState(210);
  const sceneKey=JSON.stringify([modelId,isImportedGuitar(modelId)?null:design]);
  const expectedKey=useRef(sceneKey);expectedKey.current=sceneKey;
  const payload=JSON.stringify({design,modelId,highlightedString:highlightedString??null,requestKey:sceneKey});
  useEffect(()=>{if(ready&&focused){
    let setup='';
    if(sentModel.current!==modelId){setup=isImportedGuitar(modelId)?`window.setImportedAsset(${JSON.stringify(modelId)},${JSON.stringify(importedModels[modelId])});`:'window.setImportedAsset(null,null);';sentModel.current=modelId;}
    ref.current?.injectJavaScript(`${setup}window.updateGuitar(${payload});true;`);
  }},[payload,ready,focused,modelId]);
  useEffect(()=>{if(!focused){setReady(false);setRenderedKey(null);sentModel.current=null;}},[focused]);
  useEffect(()=>{if(!focused||ready||failed)return;const timer=setTimeout(()=>setFailed(true),15000);return()=>clearTimeout(timer);},[focused,ready,failed]);
  // Renderer readiness does not guarantee that decoding the model completed.
  // Pitch updates must not restart this deadline indefinitely.
  useEffect(()=>{if(!focused||!ready||failed||renderedKey===sceneKey)return;const timer=setTimeout(()=>setFailed(true),15000);return()=>clearTimeout(timer);},[focused,ready,failed,sceneKey,renderedKey]);
  return <View pointerEvents="box-none" style={styles.fill} onLayout={event=>setSceneHeight(event.nativeEvent.layout.height)}>
    {focused&&!failed?<WebView pointerEvents="none" ref={ref} source={source} originWhitelist={['*']} style={[styles.web, mirrored && styles.mirrored]}
      javaScriptEnabled scrollEnabled={false} bounces={false} domStorageEnabled={false}
      allowFileAccess={false} allowFileAccessFromFileURLs={false} allowUniversalAccessFromFileURLs={false}
      setSupportMultipleWindows={false} onShouldStartLoadWithRequest={request=>request.url==='about:blank'}
      onMessage={event=>{try{const message=JSON.parse(event.nativeEvent.data);if(message.type==='ready')setReady(true);if(message.type==='rendered'&&message.requestKey===expectedKey.current)setRenderedKey(message.requestKey);if(message.type==='error')setFailed(true);}catch{setFailed(true);}}}
      onError={()=>setFailed(true)} onRenderProcessGone={()=>setFailed(true)} />:null}
    {focused&&!failed&&renderedKey!==sceneKey&&<View pointerEvents="none" style={styles.loading}><ActivityIndicator color="#b3b8c7"/><Text style={styles.label}>Loading guitar…</Text></View>}
    {failed&&<View style={styles.fallback}><View style={mirrored && styles.mirrored}><FullGuitarSvg design={design} modelId={modelId} width={88} height={Math.max(40,Math.min(150,sceneHeight-86))} highlightedString={highlightedString}/></View><Text style={[styles.label,{textAlign:'center'}]}>Image preview</Text><Pressable accessibilityRole="button" accessibilityLabel="3D unavailable. Retry 3D guitar" onPress={()=>{sentModel.current=null;setReady(false);setRenderedKey(null);setFailed(false);}} style={{padding:8,minHeight:48,justifyContent:'center'}}><Text style={{color:'#FFD166',fontSize:14}}>Retry 3D</Text></Pressable></View>}
  </View>;
}
const styles=StyleSheet.create({fill:{position:'absolute',top:0,bottom:0,left:0,right:0,overflow:'hidden',borderRadius:20},web:{flex:1,backgroundColor:'#141522'},mirrored:{transform:[{scaleX:-1}]},loading:{...StyleSheet.absoluteFill,alignItems:'center',justifyContent:'center',gap:8,backgroundColor:'#141522'},fallback:{alignItems:'center',alignSelf:'center',maxWidth:'40%',flex:1,justifyContent:'center'},label:{color:'#b3b8c7',fontSize:12}});
