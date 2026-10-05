import React from 'react';
import CameraScanner from '../../components/CameraScanner';

export default function ProductScannerScreen({ navigation }) {
  const handleScan = ({ data }) => {
    navigation.navigate({
      name: 'ProductForm',
      params: { scannedBarcode: data, scanTs: Date.now() },
      merge: true,
    });
  };

  return (
    <CameraScanner
      onScan={handleScan}
      onClose={() => navigation.goBack()}
      hintText="Scan to fill the barcode field"
    />
  );
}