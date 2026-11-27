/**
 * ============================================================================
 * PERCHICK – Perfectly Chicken (Pre-Order Batch 3)
 * Google Apps Script: Simpan Bukti Bayar ke Google Drive + Rekap ke Google Sheets
 * ============================================================================
 * CARA PASANG:
 * 1. Buka Google Sheets baru (https://sheets.new), beri nama misal "Rekap Order PERCHICK".
 * 2. Klik menu: Extensions -> Apps Script.
 * 3. Hapus semua kode bawaan, lalu paste seluruh kode di file ini.
 * 4. Klik Save (ikon disket).
 * 5. Klik Deploy -> New deployment -> pilih Type: "Web app".
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Klik Deploy -> Authorize access -> salin "Web app URL".
 * 7. Paste URL tersebut ke file `.env.local` di project Next.js:
 *    NEXT_PUBLIC_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/..../exec
 * ============================================================================
 */

const DRIVE_FOLDER_NAME = 'PERCHICK - Bukti Pembayaran';
const SHEET_NAME = 'Orders';

function getOrCreateDriveFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(folderName);
}

function savePaymentProofToDrive(orderId, paymentProof) {
  if (!paymentProof || !paymentProof.previewDataUrl) {
    return '-';
  }

  const parts = paymentProof.previewDataUrl.split(',');
  if (parts.length < 2) {
    return '-';
  }

  const base64Data = parts[1];
  const mimeType = paymentProof.mimeType || 'image/jpeg';
  const ext = mimeType.indexOf('png') !== -1 ? 'png' : 'jpg';
  const blob = Utilities.newBlob(
    Utilities.base64Decode(base64Data),
    mimeType,
    orderId + '-bukti-qris.' + ext
  );

  const folder = getOrCreateDriveFolder(DRIVE_FOLDER_NAME);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return file.getUrl();
}

function getOrCreateOrdersSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Order ID',
      'Waktu Order',
      'Nama',
      'No. WhatsApp',
      'Jadwal',
      'Metode',
      'Link Google Maps',
      'Alamat Lengkap',
      'Catatan',
      'Detail Pesanan',
      'Subtotal Paket',
      'Mix Saus',
      'Add-on Mushroom',
      'Total Bayar',
      'Link Bukti Pembayaran',
    ]);
    sheet.getRange(1, 1, 1, 15).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function doPost(e) {
  try {
    const raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    const data = JSON.parse(raw);

    const proofUrl = savePaymentProofToDrive(data.orderId || 'ORDER', data.paymentProof);
    const sheet = getOrCreateOrdersSheet();

    const itemsSummary = Array.isArray(data.items)
      ? data.items
          .map(function (item) {
            const mushroomText = item.addMushroom ? ' + Mushroom' : '';
            return (
              item.quantity +
              'x ' +
              item.packageName +
              ' (' +
              item.sidesLabel +
              ' • ' +
              item.sauceName +
              mushroomText +
              ')'
            );
          })
          .join('\n')
      : '-';

    const customer = data.customer || {};
    const pricing = data.pricing || {};
    const schedule = data.deliverySchedule || {};
    const mapsUrl =
      customer.mapPin && customer.mapPin.googleMapsUrl
        ? customer.mapPin.googleMapsUrl
        : '-';

    sheet.appendRow([
      data.orderId || '-',
      data.createdAt || new Date().toISOString(),
      customer.fullName || '-',
      "'" + (customer.whatsapp || '-'),
      schedule.dayLabel || '-',
      customer.fulfillmentMethod || '-',
      mapsUrl,
      customer.address || '-',
      customer.notes || '-',
      itemsSummary,
      pricing.subtotalPackages || 0,
      pricing.totalMixSauce || 0,
      pricing.totalMushroom || 0,
      pricing.grandTotal || 0,
      proofUrl,
    ]);

    return ContentService.createTextOutput(
      JSON.stringify({ ok: true, orderId: data.orderId, proofUrl: proofUrl })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
