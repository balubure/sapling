import styled from '@emotion/styled';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FC } from 'react';
import { Button } from './controls/Button';
import { useDialogState } from './controls/Dialog';
import { DownloadNameDialog } from './DownloadNameDialog';
import { MeshGenerator } from './MeshGenerator';
import { colors } from './styles';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  PropertyGroupEdit,
  PropertyMap,
  RepeatingPropertyGroup,
  RepeatingPropertyGroupEdit,
} from './properties';

const ControlPanelElt = styled.aside`
  background-color: ${colors.controlPaletteBg};
  color: ${colors.text};
  flex: 0 1 20rem;
  font-weight: 500;
  font-size: 16px;
  padding: 16px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    background-color: transparent;
    width: 7px;
    height: 7px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 6px;
  }

  &::-webkit-scrollbar-thumb:window-inactive {
    background-color: rgba(0, 0, 0, 0.1);
  }

  &::-webkit-scrollbar-corner {
    background-color: transparent;
  }
`;

const ButtonGroup = styled.section`
  > button {
    margin-right: 4px;
  }
`;

interface Props {
  generator: MeshGenerator;
}

export const ControlPanel: FC<Props> = ({ generator }) => {
  const fileInput = useRef<HTMLInputElement>(null);
  const { dialogProps, visible, setOpen } = useDialogState();
  const [name, setName] = useState('tree-model');

  useEffect(() => {
    try {
      const json = localStorage.getItem('sapling-doc');
      if (json) {
        generator.fromJson(JSON.parse(json));
      }
    } catch (e) {
      console.error('Invalid JSON', e);
    }

    const onUnload = () => {
      localStorage.setItem('sapling-doc', JSON.stringify(generator.toJson()));
    };

    window.addEventListener('unload', onUnload);
    return () => window.removeEventListener('unload', onUnload);
  }, [generator]);

  const onClickReset = useCallback(() => generator.reset(), [generator]);

  const onClickSave = useCallback(() => {
    setOpen(true);
  }, [setOpen]);

  const onClickDownload = useCallback(() => {
    setOpen(false);
    generator.downloadGltf(name);
  }, [generator, setOpen, name]);

  const onClickLoad = useCallback(() => {
    if (fileInput.current) {
      fileInput.current.value = '';
      fileInput.current.click();
    }
  }, []);

  const onFileChanged = useCallback(() => {
    if (fileInput.current && fileInput.current.files && fileInput.current.files.length > 0) {
      const file = fileInput.current.files[0];
      const loader = new GLTFLoader();
      loader.load(
        URL.createObjectURL(file),
        gltf => {
          const json = gltf.scene?.userData?.sapling;
          if (json) {
            generator.fromJson(json);
          } else {
            window.alert('Model file does not contain Sapling metadata.');
          }
        },
        undefined,
        error => {
          console.error(error);
        }
      );
    }
  }, [generator]);

  return (
    <ControlPanelElt>
      {Object.keys(generator.properties).map(key => {
        const group = (generator.properties as PropertyMap)[key];
        if (group instanceof RepeatingPropertyGroup) {
          return <RepeatingPropertyGroupEdit key={key} group={group} groupName={key} />;
        } else {
          return <PropertyGroupEdit key={key} group={group} groupName={key} />;
        }
      })}
      <ButtonGroup>
        <Button onClick={onClickReset}>Reset</Button>
        <Button onClick={onClickSave}>Download&hellip;</Button>
        <Button onClick={onClickLoad}>Load&hellip;</Button>
      </ButtonGroup>
      <form style={{ display: 'none' }}>
        <input ref={fileInput} type="file" accept="model/*" onChange={onFileChanged} />
      </form>
      {visible && (
        <DownloadNameDialog
          {...dialogProps}
          name={name}
          onChangeName={setName}
          onDownload={onClickDownload}
        />
      )}
    </ControlPanelElt>
  );
};
