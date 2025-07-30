import React, { useState, useEffect } from 'react';
import { Client, LocalAuth } from 'whatsapp-web.js';
import * as qrcode from 'qrcode';

interface WhatsAppInstanceProps {
  instanceId: string;
  onStatusChange: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => void;
  onQRCodeGenerated: (qrCode: string) => void;
  onPhoneNumberReceived: (phoneNumber: string) => void;
}

const WhatsAppInstance: React.FC<WhatsAppInstanceProps> = ({
  instanceId,
  onStatusChange,
  onQRCodeGenerated,
  onPhoneNumberReceived
}) => {
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    const initializeClient = () => {
      const newClient = new Client({
        authStrategy: new LocalAuth({
          clientId: instanceId
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ]
        }
      });

      newClient.on('qr', async (qr) => {
        try {
          const qrCodeDataUrl = await qrcode.toDataURL(qr);
          onQRCodeGenerated(qrCodeDataUrl);
          onStatusChange('connecting');
        } catch (error) {
          console.error('Error generating QR code:', error);
          onStatusChange('error');
        }
      });

      newClient.on('ready', () => {
        console.log('Client is ready!');
        onStatusChange('connected');
        if (newClient.info) {
          onPhoneNumberReceived(newClient.info.wid.user);
        }
      });

      newClient.on('authenticated', () => {
        console.log('Client is authenticated!');
      });

      newClient.on('auth_failure', (msg) => {
        console.error('Authentication failed:', msg);
        onStatusChange('error');
      });

      newClient.on('disconnected', (reason) => {
        console.log('Client was disconnected:', reason);
        onStatusChange('disconnected');
      });

      setClient(newClient);
      newClient.initialize();
    };

    initializeClient();

    return () => {
      if (client) {
        client.destroy();
      }
    };
  }, [instanceId]);

  const disconnect = () => {
    if (client) {
      client.destroy();
      onStatusChange('disconnected');
    }
  };

  const sendMessage = async (to: string, message: string) => {
    if (client && client.info) {
      try {
        const chatId = to.includes('@c.us') ? to : `${to}@c.us`;
        await client.sendMessage(chatId, message);
        return true;
      } catch (error) {
        console.error('Error sending message:', error);
        return false;
      }
    }
    return false;
  };

  const checkNumber = async (phoneNumber: string): Promise<boolean> => {
    if (client && client.info) {
      try {
        const chatId = phoneNumber.includes('@c.us') ? phoneNumber : `${phoneNumber}@c.us`;
        const chat = await client.getChatById(chatId);
        return chat.isRegistered;
      } catch (error) {
        console.error('Error checking number:', error);
        return false;
      }
    }
    return false;
  };

  return null; // Este componente no renderiza nada visualmente
};

export default WhatsAppInstance; 