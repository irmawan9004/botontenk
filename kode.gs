//CONFIG
var BOT_TOKEN = "7821445062:AAH-X-kKKr67XsgSIjme5WikKA1_7Vu7NcA"; // BOT TOKEN ANDA
var SS_URL = "https://docs.google.com/spreadsheets/d/1B5OXUYieCaWrWjWolRaE4FVzPear4sjpuWln1bvY1jA/edit?gid=0"; // URL SPREADSHEET
var SALES_SHEET_NAME = "LaporanPenjualanTahuBaksoGembok"; // NAMA SHEET UNTUK LAPORAN

// BEGIN
const ss = SpreadsheetApp.openByUrl(SS_URL);

// Fungsi untuk membuat sheet otomatis jika belum ada
function createSheetIfNotExists(sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);  // Only append if headers are provided
      Logger.log(`Sheet ${sheetName} dibuat.`);
    } else {
      Logger.log(`No headers provided for sheet ${sheetName}.`);
    }
  } else {
    Logger.log(`Sheet ${sheetName} sudah ada.`);
  }
  return sheet;
}

// Pastikan sheet laporan penjualan ada
const salesSheet = createSheetIfNotExists(SALES_SHEET_NAME, [
  "_id",
  "_date",
  "Tanggal",
  "Kategori",
  "Bawa(pack)",
  "Bawa(pcs)",
  "Laku(pack)",
  "Laku(pcs)",
  "Sisa(pcs)",
  "ReporterName",
]);


function doGet(e) {
  return HtmlService.createHtmlOutput("<h1>OK</h1>");
}

function doPost(e) {
  try {
    if (e.postData.type === "application/json") {
      let update = JSON.parse(e.postData.contents);
      if (update) {
        commands(update);
        return true;
      }
    }
  } catch (error) {
    Logger.log(error);
  }
}

function commands(update) {
  const chatId = update.message.chat.id;
  const firstName = update.message.chat.first_name;
  const text = update.message.text || "";
  const tanggal = new Date().toLocaleString();
  const _date = new Date().toJSON();

  if (text.startsWith("/start")) {
    const welcomeMessage = `Halo ${firstName}, Sudah Berjualan Saatnya Dilaporkan! Lhess💪🏼\n\n` +
      "Berikut adalah perintah yang tersedia:\n" +
      "1. /lapor #kategori [bawa(pcs)] [laku(pcs)]\n" +
      "   - Gunakan perintah ini untuk melaporkan penjualan Anda.\n\n" +
      "   - Contoh:\n" +
      "           /lapor #tahubakso 10(Pcs) 5(Pcs)\n\n" +
      "   - 'bawa' adalah jumlah barang yang Anda bawa untuk dijual.\n" +
      "   - 'laku' adalah jumlah barang yang berhasil terjual.\n" +
      "   - Sisa akan dihitung otomatis.\n\n" +
      "2. /rekap [tanggal/bulan] [tanggal/bulan (opsional)]\n" +
      "   - Gunakan perintah ini untuk melihat rekap penjualan.\n\n" +
      "   - Contoh:\n " +
      "           /rekap 2024-01\n" +
      "           /rekap 2024-01 2024-02\n\n" +
      "   - Lihat data penjualan berdasarkan waktu.\n\n" +
      "Selamat menggunakan bot ini! Jika ada pertanyaan, silakan hubungi admin Birin👨🏽‍🍳."

    sendMessage({
      chat_id: chatId,
      text: welcomeMessage,
    });
  } else if (text.startsWith("/lapor")) {
  const stext = text.split(" ");

  const kategori = stext[1]?.startsWith('#') ? stext[1].replace('#', '') : '';
  const bawa = stext[2]?.replace('pcs', '');  // Menghapus 'pcs' dari input
  const laku = stext[3]?.replace('pcs', '');  // Menghapus 'pcs' dari input

  if (kategori && bawa && laku) {
    const bawaPcs = parseInt(bawa) || 0;
    const lakuPcs = parseInt(laku) || 0;

    // Total stok dan terjual dihitung langsung dalam pcs
    const perPack = 6;

    // Menghitung totalBawa dalam pcs
    const totalBawa = bawaPcs;  

    // Menghitung totalLaku dalam pcs
    const totalLaku = lakuPcs;

    // Menghitung jumlah pack untuk bawa (membagi dengan perPack)
    const totalBawaPack = Math.ceil(totalBawa / perPack);

    // Menghitung jumlah pack untuk laku (membagi dengan perPack dan membulatkan ke atas)
    const totalLakuPack = Math.ceil(totalLaku / perPack);



    const sisa = totalBawa - totalLaku;

    if (sisa >= 0) {
      salesSheet.appendRow([
        salesSheet.getLastRow(),
        _date,
        tanggal,
        kategori,
        `${totalBawaPack}pack`,
        `${bawaPcs}pcs`,
        `${totalLakuPack}pack`,
        `${lakuPcs}pcs`,
        `${sisa}pcs`,
        firstName,
      ]);

      sendMessage({
        chat_id: chatId,
        text: "Laporan penjualan berhasil✅, Terima kasih sudah Bekerja semoga Berkah🌞",
      });
    } else {
      sendMessage({
        chat_id: chatId,
        text: "Gagal mencatat laporan❌. Jumlah terjual melebihi stok yang dibawa.",
      });
    }
  } else {
    sendMessage({
      chat_id: chatId,
      text: "Format salah❌. Gunakan: /lapor #kategori [bawa(pcs)] [laku(pcs)]",
    });
  }
 } else if (text.startsWith("/rekap")) {
    const stext = text.split(" ");
    stext.splice(0, 1);

    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const oDateRange = Collection.generateDateRange(stext.join(" "));
    const dataRange = oDateRange.dateRange;

    if (dataRange.length > 0) {
      let textToSend = "Rekapitulasi Penjualan:\n";

      for (let _date of dataRange) {
        const laporan = salesSheet.getDataRange().getValues().filter((row, index) => {
          if (index === 0) return false; // Skip header
          const rowDate = new Date(row[1]);
          return rowDate >= _date.from && rowDate < _date.to;
        });

        textToSend += `\nBulan ${monthNames[_date.from.getMonth()]} ${_date.from.getFullYear()}\n`;
        laporan.forEach(row => {
          textToSend += `Kategori: ${row[3]}, Bawa: ${row[4]}, Laku: ${row[5]}, Sisa: ${row[6]}\n`;
        });
      }

      sendMessage({
        chat_id: chatId,
        text: textToSend,
      });
    } else {
      sendMessage({
        chat_id: chatId,
        text: "Format salah❌. Gunakan: /rekap [tanggal/bulan] [tanggal/bulan (opsional)]",
      });
    }
  } else {
    sendMessage({
      chat_id: chatId,
      text: "Command tidak dikenali❌. Gunakan /start untuk melihat daftar perintah.",
    });
  }
}

function sendMessage(postdata) {
  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(postdata),
    muteHttpExceptions: true,
  };
  UrlFetchApp.fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage', options);
}
