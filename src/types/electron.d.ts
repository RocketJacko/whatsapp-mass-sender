declare global {
  interface Window {
    electronAPI: {
      getStoredInstances: () => Promise<any[]>;
      saveInstance: (instance: any) => Promise<boolean>;
      removeInstance: (instanceId: string) => Promise<boolean>;
    };
  }
}

export {}; 