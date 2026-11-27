/**
 * ============================================================================
 * PERCHICK - Perfectly Chicken (Pre-Order Batch 3)
 * Google Apps Script: Simpan Bukti Bayar ke Google Drive + Rekap ke Google Sheets
 * ============================================================================
 */

var DRIVE_FOLDER_NAME = 'PERCHICK - Bukti Pembayaran';
var SHEET_NAME = 'Orders';

function formatRupiah(amount) {
  var num = Math.round(Number(amount) || 0);
  return 'Rp' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function getOrCreateDriveFolder(folderName) {
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(folderName);
}

function savePaymentProofToDrive(orderId, paymentProof) {
  if (!paymentProof || !paymentProof.previewDataUrl) {
    return '-';
  }

  var parts = paymentProof.previewDataUrl.split(',');
  if (parts.length < 2) {
    return '-';
  }

  var base64Data = parts[1];
  var mimeType = paymentProof.mimeType || 'image/jpeg';
  var ext = mimeType.indexOf('png') !== -1 ? 'png' : 'jpg';
  var blob = Utilities.newBlob(
    Utilities.base64Decode(base64Data),
    mimeType,
    orderId + '-bukti-qris.' + ext
  );

  var folder = getOrCreateDriveFolder(DRIVE_FOLDER_NAME);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return file.getUrl();
}

function applySheetFormatting(sheet) {
  var widths = [
    130, // 1. Order ID
    135, // 2. Waktu
    160, // 3. Nama
    130, // 4. No. WhatsApp
    320, // 5. Detail Pesanan
    130, // 6. Subtotal/Paket
    130, // 7. Total Bayar
    180, // 8. Catatan
    150, // 9. Jadwal
    95,  // 10. Metode
    220, // 11. Link Google Map
    280, // 12. Alamat Lengkap
    240  // 13. Link Bukti Pembayaran
  ];

  for (var i = 0; i < widths.length; i++) {
    sheet.setColumnWidth(i + 1, widths[i]);
  }
}

function getOrCreateOrdersSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Order ID',
      'Waktu',
      'Nama',
      'No. WhatsApp',
      'Detail Pesanan',
      'Subtotal/Paket',
      'Total Bayar',
      'Catatan',
      'Jadwal',
      'Metode',
      'Link Google Map',
      'Alamat Lengkap',
      'Link Bukti Pembayaran'
    ]);

    var headerRange = sheet.getRange(1, 1, 1, 13);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#FFC72C');
    headerRange.setFontColor('#1C1917');
    sheet.setFrozenRows(1);
    applySheetFormatting(sheet);
  }

  return sheet;
}

function doPost(e) {
  try {
    var raw = '{}';
    if (e && e.postData && e.postData.contents) {
      raw = e.postData.contents;
    }
    var data = JSON.parse(raw);

    var proofUrl = savePaymentProofToDrive(data.orderId || 'ORDER', data.paymentProof);
    var sheet = getOrCreateOrdersSheet();

    var itemsSummary = '-';
    var subtotalLines = formatRupiah(0);

    if (Array.isArray(data.items) && data.items.length > 0) {
      itemsSummary = data.items
        .map(function (item) {
          var mushroomText = item.addMushroom ? ' + Mushroom' : '';
          return (
            item.quantity +
            'x ' +
            item.packageName +
            ' (' +
            item.sidesLabel +
            ' - ' +
            item.sauceName +
            mushroomText +
            ')'
          );
        })
        .join('\n');

      subtotalLines = data.items
        .map(function (item) {
          return formatRupiah(item.lineTotal || 0);
        })
        .join('\n');
    }

    var customer = data.customer || {};
    var pricing = data.pricing || {};
    var schedule = data.deliverySchedule || {};
    var mapsUrl = '-';
    if (customer.mapPin && customer.mapPin.googleMapsUrl) {
      mapsUrl = customer.mapPin.googleMapsUrl;
    }

    var waktuFormatted = Utilities.formatDate(
      new Date(),
      'Asia/Jakarta',
      'dd/MM/yyyy HH:mm'
    );

    sheet.appendRow([
      data.orderId || '-',
      waktuFormatted,
      customer.fullName || '-',
      "'" + (customer.whatsapp || '-'),
      itemsSummary,
      subtotalLines,
      formatRupiah(pricing.grandTotal || 0),
      customer.notes || '-',
      schedule.dayLabel || '-',
      customer.fulfillmentMethod || '-',
      mapsUrl,
      customer.address || '-',
      proofUrl
    ]);

    var lastRow = sheet.getLastRow();
    var rowRange = sheet.getRange(lastRow, 1, 1, 13);
    rowRange.setVerticalAlignment('top');
    rowRange.setWrap(true);

    return ContentService.createTextOutput(
      JSON.stringify({ ok: true, orderId: data.orderId, proofUrl: proofUrl })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
