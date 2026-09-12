import React from 'react';
import { Modal } from 'react-native';
import type { GuitarType } from '../../progression/guitarModels';
import GuitarLocker from './GuitarLocker';

/** Both entry points use the same collection, box and unlock screen. */
export default function GuitarModelPicker({visible,onClose}:{visible:boolean;onClose:()=>void;guitarType?:GuitarType}) {
  return <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
    {visible && <GuitarLocker onExit={onClose} />}
  </Modal>;
}
