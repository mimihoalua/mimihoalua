(function () {
  var WML = "http://schemas.openxmlformats.org/" + "officeDocument/wordprocessingml/2006/main";
  function xml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&" + "amp;")
      .replace(/</g, "&" + "lt;")
      .replace(/>/g, "&" + "gt;");
  }
  function para(text, opt) {
    var o = opt || {};
    var size = o.size || 22;
    var font = "Times New Roman";
    var align = o.align ? "<w:jc w:val=\"" + o.align + "\"/>" : "";
    var space = "<w:spacing w:before=\"" + (o.before || 0) + "\" w:after=\"" + (o.after == null ? 60 : o.after) + "\"/>";
    return "<w:p><w:pPr>" + align + space + "</w:pPr><w:r><w:rPr><w:rFonts w:ascii=\"" + font + "\" w:hAnsi=\"" + font + "\" w:cs=\"" + font + "\"/>" +
      (o.bold ? "<w:b/>" : "") + (o.italic ? "<w:i/>" : "") +
      (o.color ? "<w:color w:val=\"" + o.color + "\"/>" : "") +
      "<w:sz w:val=\"" + size + "\"/><w:szCs w:val=\"" + size + "\"/></w:rPr><w:t xml:space=\"preserve\">" + xml(text) + "</w:t></w:r></w:p>";
  }
  function cell(text, opt) {
    var o = opt || {};
    var fill = o.fill ? "<w:shd w:val=\"clear\" w:color=\"auto\" w:fill=\"" + o.fill + "\"/>" : "";
    var span = o.span ? "<w:gridSpan w:val=\"" + o.span + "\"/>" : "";
    return "<w:tc><w:tcPr><w:tcW w:w=\"" + (o.w || 1400) + "\" w:type=\"dxa\"/>" + span + fill + "<w:vAlign w:val=\"center\"/></w:tcPr>" +
      para(text, { size: o.size || 20, bold: o.bold, italic: o.italic, color: o.color, align: o.align || "left", before: 40, after: 40 }) + "</w:tc>";
  }
  function documentXml(m) {
    var widths = [700, 4200, 900, 1100, 1600, 1800];
    var head = ["STT", "Tên hàng hóa, dịch vụ", "ĐVT", "Số lượng", "Đơn giá (VNĐ)", "Thành tiền (VNĐ)"];
    var borders = "<w:tblBorders><w:top w:val=\"single\" w:sz=\"8\" w:color=\"B08D57\"/><w:left w:val=\"single\" w:sz=\"8\" w:color=\"B08D57\"/><w:bottom w:val=\"single\" w:sz=\"8\" w:color=\"B08D57\"/><w:right w:val=\"single\" w:sz=\"8\" w:color=\"B08D57\"/><w:insideH w:val=\"single\" w:sz=\"4\" w:color=\"D8C7A8\"/><w:insideV w:val=\"single\" w:sz=\"4\" w:color=\"D8C7A8\"/></w:tblBorders>";
    var nil = "<w:tblBorders><w:top w:val=\"nil\"/><w:left w:val=\"nil\"/><w:bottom w:val=\"nil\"/><w:right w:val=\"nil\"/><w:insideH w:val=\"nil\"/><w:insideV w:val=\"nil\"/></w:tblBorders>";
    var headRow = "<w:tr>" + head.map(function (label, i) {
      return cell(label, { w: widths[i], fill: "7A2E24", color: "FFFFFF", bold: true, align: "center", size: 18 });
    }).join("") + "</w:tr>";
    var body = (m.items || []).map(function (item, i) {
      return "<w:tr>" + [
        cell(String(i + 1), { w: widths[0], align: "center" }),
        cell(item.name || "", { w: widths[1] }),
        cell(item.unit || "", { w: widths[2], align: "center" }),
        cell(String(item.qty || 0), { w: widths[3], align: "center" }),
        cell(item.priceText || "", { w: widths[4], align: "right" }),
        cell(item.amountText || "", { w: widths[5], align: "right", bold: true })
      ].join("") + "</w:tr>";
    }).join("");
    function sumRow(label, value, fill) {
      var color = fill === "7A2E24" ? "FFFFFF" : "2C1810";
      return "<w:tr>" + cell(label, { w: 8500, span: 5, align: "right", bold: true, fill: fill || "FBF6EE", color: color }) +
        cell(value, { w: widths[5], align: "right", bold: true, fill: fill || "FBF6EE", color: color }) + "</w:tr>";
    }
    var notes = (m.notes || []).map(function (line) { return para(line, { size: 21 }); }).join("");
    var sign = m.signRole ? para(m.signRole, { align: "center", size: 22, before: 80, after: 0 }) : "";
    return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
      "<w:document xmlns:w=\"" + WML + "\"><w:body>" +
      para(m.kicker || "", { align: "center", size: 18, color: "B08D57", bold: true, after: 40 }) +
      para(m.companyName || "", { align: "center", size: 32, bold: true, color: "7A2E24", after: 40 }) +
      para(m.meta || "", { align: "center", size: 21, after: 0 }) +
      para(m.addressLine || "", { align: "center", size: 21, after: 80 }) +
      para(m.dateLine || "", { align: "right", italic: true, size: 22, before: 160 }) +
      para(m.title || "BẢNG BÁO GIÁ", { align: "center", size: 36, bold: true, color: "7A2E24", before: 200, after: 80 }) +
      "<w:tbl><w:tblPr><w:tblW w:w=\"10300\" w:type=\"dxa\"/>" + nil + "</w:tblPr><w:tblGrid><w:gridCol w:w=\"6200\"/><w:gridCol w:w=\"4100\"/></w:tblGrid><w:tr>" +
      cell(m.greet || "", { w: 6200, italic: true, size: 22 }) +
      cell(m.docNoLine || "", { w: 4100, align: "right", italic: true, size: 22 }) +
      "</w:tr></w:tbl>" +
      para(m.intro || "", { size: 22, before: 80, after: 120 }) +
      "<w:tbl><w:tblPr><w:tblW w:w=\"10300\" w:type=\"dxa\"/>" + borders + "<w:tblLayout w:type=\"fixed\"/></w:tblPr><w:tblGrid>" +
      widths.map(function (w) { return "<w:gridCol w:w=\"" + w + "\"/>"; }).join("") + "</w:tblGrid>" +
      headRow + body +
      sumRow(m.subLabel || "Cộng tiền hàng:", m.subText || "") +
      sumRow(m.vatLabel || "Thuế GTGT:", m.vatText || "") +
      sumRow(m.totalLabel || "Tổng thanh toán:", m.totalText || "", "7A2E24") +
      "</w:tbl>" + notes +
      para(m.thanks || "", { align: "center", italic: true, size: 22, before: 240 }) +
      "<w:tbl><w:tblPr><w:tblW w:w=\"3600\" w:type=\"dxa\"/><w:jc w:val=\"right\"/>" + nil + "</w:tblPr><w:tblGrid><w:gridCol w:w=\"3600\"/></w:tblGrid><w:tr><w:tc><w:tcPr><w:tcW w:w=\"3600\" w:type=\"dxa\"/></w:tcPr>" +
      para("ĐẠI DIỆN CÔNG TY", { align: "center", bold: true, color: "7A2E24", size: 22, before: 200, after: 0 }) +
      sign + "</w:tc></w:tr></w:tbl>" +
      "<w:sectPr><w:pgSz w:w=\"11906\" w:h=\"16838\" w:orient=\"portrait\"/><w:pgMar w:top=\"851\" w:right=\"851\" w:bottom=\"851\" w:left=\"851\" w:header=\"454\" w:footer=\"454\" w:gutter=\"0\"/></w:sectPr>" +
      "</w:body></w:document>";
  }
  function stripDirEntries(u8) {
    var data = u8 instanceof Uint8Array ? u8 : new Uint8Array(u8);
    var view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    var eocd = -1;
    var i;
    for (i = data.length - 22; i >= 0; i--) {
      if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) return data;
    var cdCount = view.getUint16(eocd + 10, true);
    var cdOff = view.getUint32(eocd + 16, true);
    var kept = [];
    var p = cdOff;
    for (var n = 0; n < cdCount; n++) {
      if (view.getUint32(p, true) !== 0x02014b50) break;
      var nameLen = view.getUint16(p + 28, true);
      var extraLen = view.getUint16(p + 30, true);
      var commentLen = view.getUint16(p + 32, true);
      var localOff = view.getUint32(p + 42, true);
      var name = "";
      for (var c = 0; c < nameLen; c++) name += String.fromCharCode(data[p + 46 + c]);
      var recLen = 46 + nameLen + extraLen + commentLen;
      if (name.charAt(name.length - 1) !== "/") kept.push({ cdStart: p, cdLen: recLen, localOff: localOff });
      p += recLen;
    }
    kept.sort(function (a, b) { return a.localOff - b.localOff; });
    var pieces = [];
    var cursor = 0;
    kept.forEach(function (e) {
      var lh = e.localOff;
      var flags = view.getUint16(lh + 6, true);
      var comp = view.getUint32(lh + 18, true);
      var nLen = view.getUint16(lh + 26, true);
      var xLen = view.getUint16(lh + 28, true);
      var localSize = 30 + nLen + xLen + comp;
      if (flags & 8) {
        var dd = lh + localSize;
        if (dd + 4 <= data.length && view.getUint32(dd, true) === 0x08074b50) localSize += 16;
        else localSize += 12;
      }
      var slice = data.slice(lh, lh + localSize);
      var cd = data.slice(e.cdStart, e.cdStart + e.cdLen);
      new DataView(cd.buffer, cd.byteOffset, cd.byteLength).setUint32(42, cursor, true);
      pieces.push({ slice: slice, cd: cd });
      cursor += slice.length;
    });
    var cdLen = 0;
    pieces.forEach(function (e) { cdLen += e.cd.length; });
    var out = new Uint8Array(cursor + cdLen + 22);
    var w = 0;
    pieces.forEach(function (e) { out.set(e.slice, w); w += e.slice.length; });
    var cdStart = w;
    pieces.forEach(function (e) { out.set(e.cd, w); w += e.cd.length; });
    var ev = new DataView(out.buffer);
    ev.setUint32(w, 0x06054b50, true);
    ev.setUint16(w + 8, pieces.length, true);
    ev.setUint16(w + 10, pieces.length, true);
    ev.setUint32(w + 12, cdLen, true);
    ev.setUint32(w + 16, cdStart, true);
    return out;
  }
  function pack(m) {
    var zip = new window.JSZip();
    zip.file("[Content_Types].xml", "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
      "<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">" +
      "<Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>" +
      "<Default Extension=\"xml\" ContentType=\"application/xml\"/>" +
      "<Override PartName=\"/word/document.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml\"/>" +
      "<Override PartName=\"/word/styles.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml\"/>" +
      "<Override PartName=\"/docProps/core.xml\" ContentType=\"application/vnd.openxmlformats-package.core-properties+xml\"/>" +
      "<Override PartName=\"/docProps/app.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.extended-properties+xml\"/>" +
      "</Types>");
    zip.file("_rels/.rels", "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
      "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">" +
      "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"word/document.xml\"/>" +
      "<Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties\" Target=\"docProps/core.xml\"/>" +
      "<Relationship Id=\"rId3\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties\" Target=\"docProps/app.xml\"/>" +
      "</Relationships>");
    zip.file("word/document.xml", documentXml(m));
    zip.file("word/styles.xml", "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
      "<w:styles xmlns:w=\"" + WML + "\"><w:docDefaults><w:rPrDefault><w:rPr>" +
      "<w:rFonts w:ascii=\"Times New Roman\" w:hAnsi=\"Times New Roman\" w:cs=\"Times New Roman\"/>" +
      "<w:sz w:val=\"22\"/><w:szCs w:val=\"22\"/></w:rPr></w:rPrDefault></w:docDefaults>" +
      "<w:style w:type=\"paragraph\" w:default=\"1\" w:styleId=\"Normal\"><w:name w:val=\"Normal\"/><w:qFormat/></w:style></w:styles>");
    zip.file("word/_rels/document.xml.rels", "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
      "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">" +
      "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles\" Target=\"styles.xml\"/>" +
      "</Relationships>");
    zip.file("docProps/core.xml", "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
      "<cp:coreProperties xmlns:cp=\"http://schemas.openxmlformats.org/package/2006/metadata/core-properties\" xmlns:dc=\"http://purl.org/dc/elements/1.1/\">" +
      "<dc:title>" + xml(m.title || "Bao gia") + "</dc:title><dc:creator>Van Vuong</dc:creator></cp:coreProperties>");
    zip.file("docProps/app.xml", "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
      "<Properties xmlns=\"http://schemas.openxmlformats.org/officeDocument/2006/extended-properties\">" +
      "<Application>Microsoft Office Word</Application></Properties>");
    return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" }).then(function (u8) {
      return new Blob([stripDirEntries(u8)], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    });
  }
  function download(blob, name) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
  }
  function esc(s) {
    return xml(s).replace(/"/g, "&" + "quot;");
  }
  function wordFile(m) {
    var head = ["STT", "Tên hàng hóa, dịch vụ", "ĐVT", "SL", "Đơn giá (VNĐ)", "Thành tiền (VNĐ)"];
    var body = (m.items || []).map(function (item, i) {
      return "<tr><td class=\"c\">" + (i + 1) + "</td><td>" + esc(item.name || "") + "</td><td class=\"c\">" + esc(item.unit || "") + "</td><td class=\"c\">" + esc(item.qty || 0) + "</td><td class=\"r\">" + esc(item.priceText || "") + "</td><td class=\"r b\">" + esc(item.amountText || "") + "</td></tr>";
    }).join("");
    var notes = (m.notes || []).map(function (line) { return "<p class=\"note\">" + esc(line) + "</p>"; }).join("");
    var logo = m.logoSrc ? "<p class=\"c\"><img src=\"" + m.logoSrc + "\" width=\"92\" height=\"92\"></p>" : "";
    var sign = m.signRole ? "<div class=\"role\">" + esc(m.signRole) + "</div>" : "";
    var html = "<html xmlns:o=\"urn:schemas-microsoft-com:office:office\" xmlns:w=\"urn:schemas-microsoft-com:office:word\" xmlns=\"http://www.w3.org/TR/REC-html40\"><head><meta charset=\"utf-8\"><title>" + esc(m.title || "Bao gia") + "</title>" +
      "<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->" +
      "<style>@page Section1{size:21.0cm 29.7cm;margin:1.4cm 1.3cm 1.4cm 1.3cm;} div.Section1{page:Section1;} body{font-family:'Times New Roman',serif;color:#2C1810;font-size:13px;} h1{color:#7A2E24;font-size:18px;text-align:center;margin:4px 0;} h2{color:#7A2E24;font-size:22px;letter-spacing:3px;text-align:center;margin:14px 0 6px;} .c{text-align:center;} .r{text-align:right;} .b{font-weight:bold;} .gold{color:#B08D57;letter-spacing:3px;text-align:center;font-size:11px;font-weight:bold;} .meta{text-align:center;color:#6B5344;margin:2px 0;} .date{text-align:right;font-style:italic;} .row{width:100%;} .row td{border:0;padding:2px 0;} table.grid{width:100%;border-collapse:collapse;margin-top:8px;} table.grid th,table.grid td{border:1px solid #B08D57;padding:6px 8px;vertical-align:middle;} table.grid th{background:#7A2E24;color:#fff;} .sum{font-weight:bold;text-align:right;background:#FBF6EE;} .grand{font-weight:bold;text-align:right;background:#7A2E24;color:#fff;} .note{margin:2px 0;} .thanks{text-align:center;font-style:italic;margin-top:16px;} .sign{width:220px;margin-left:auto;text-align:center;color:#7A2E24;font-weight:bold;margin-top:22px;} .role{font-weight:normal;color:#2C1810;margin-top:6px;}</style></head><body><div class=\"Section1\">" +
      logo +
      "<p class=\"gold\">" + esc(m.kicker || "") + "</p><h1>" + esc(m.companyName || "") + "</h1>" +
      "<p class=\"meta\">" + esc(m.meta || "") + "</p><p class=\"meta\">" + esc(m.addressLine || "") + "</p>" +
      "<p class=\"date\">" + esc(m.dateLine || "") + "</p><h2>" + esc(m.title || "") + "</h2>" +
      "<table class=\"row\"><tr><td>" + esc(m.greet || "") + "</td><td class=\"r\">" + esc(m.docNoLine || "") + "</td></tr></table>" +
      "<p>" + esc(m.intro || "") + "</p>" +
      "<table class=\"grid\"><tr>" + head.map(function (h) { return "<th>" + h + "</th>"; }).join("") + "</tr>" + body +
      "<tr><td class=\"sum\" colspan=\"5\">" + esc(m.subLabel || "Cộng tiền hàng:") + "</td><td class=\"sum\">" + esc(m.subText || "") + "</td></tr>" +
      "<tr><td class=\"sum\" colspan=\"5\">" + esc(m.vatLabel || "Thuế GTGT:") + "</td><td class=\"sum\">" + esc(m.vatText || "") + "</td></tr>" +
      "<tr><td class=\"grand\" colspan=\"5\">" + esc(m.totalLabel || "Tổng thanh toán:") + "</td><td class=\"grand\">" + esc(m.totalText || "") + "</td></tr></table>" +
      notes + "<p class=\"thanks\">" + esc(m.thanks || "") + "</p><div class=\"sign\">ĐẠI DIỆN CÔNG TY" + sign + "</div></div></body></html>";
    return new Blob(["\ufeff" + html], { type: "application/msword" });
  }
  function colName(n) {
    var s = "";
    n += 1;
    while (n > 0) { n -= 1; s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26); }
    return s;
  }
  function xCell(ref, style, value, num) {
    if (num) return "<c r=\"" + ref + "\" s=\"" + style + "\"><v>" + Number(value || 0) + "</v></c>";
    return "<c r=\"" + ref + "\" s=\"" + style + "\" t=\"inlineStr\"><is><t xml:space=\"preserve\">" + xml(value) + "</t></is></c>";
  }
  function buildXlsx(m) {
    var merges = [];
    var rows = [];
    function put(r, height, cells) {
      rows.push("<row r=\"" + r + "\"" + (height ? " ht=\"" + height + "\" customHeight=\"1\"" : "") + ">" + cells.join("") + "</row>");
    }
    function span(r, c1, c2, style, text, height) {
      merges.push(colName(c1) + r + ":" + colName(c2) + r);
      put(r, height, [xCell(colName(c1) + r, style, text, false)]);
    }
    span(1, 0, 5, 1, m.companyName || "", 26);
    span(2, 0, 5, 2, m.meta || "", 18);
    span(3, 0, 5, 2, m.addressLine || "", 18);
    span(4, 0, 5, 3, m.dateLine || "", 18);
    span(6, 0, 5, 4, m.title || "", 28);
    merges.push("A7:C7");
    merges.push("D7:F7");
    put(7, 18, [xCell("A7", 5, m.greet || "", false), xCell("D7", 3, m.docNoLine || "", false)]);
    span(8, 0, 5, 14, m.intro || "", 32);
    var headers = ["STT", "Tên hàng hóa, dịch vụ", "ĐVT", "Số lượng", "Đơn giá (VNĐ)", "Thành tiền (VNĐ)"];
    put(10, 22, headers.map(function (h, i) { return xCell(colName(i) + "10", 6, h, false); }));
    var r = 11;
    (m.items || []).forEach(function (item, i) {
      put(r, 22, [
        xCell("A" + r, 8, String(i + 1), false),
        xCell("B" + r, 7, item.name || "", false),
        xCell("C" + r, 8, item.unit || "", false),
        xCell("D" + r, 9, item.qty, true),
        xCell("E" + r, 9, item.price, true),
        xCell("F" + r, 9, item.amount, true)
      ]);
      r += 1;
    });
    function sum(label, value, labelStyle, numStyle) {
      merges.push("A" + r + ":E" + r);
      put(r, 20, [xCell("A" + r, labelStyle, label, false), xCell("F" + r, numStyle, value, true)]);
      r += 1;
    }
    sum(m.subLabel || "Cộng tiền hàng:", m.sub, 10, 11);
    sum(m.vatLabel || "Thuế GTGT:", m.vat, 10, 11);
    sum(m.totalLabel || "Tổng thanh toán:", m.total, 12, 13);
    r += 1;
    (m.notes || []).forEach(function (line) { span(r, 0, 5, 14, line, 18); r += 1; });
    span(r, 0, 5, 15, m.thanks || "", 22); r += 2;
    span(r, 0, 5, 4, "ĐẠI DIỆN CÔNG TY", 20); r += 1;
    if (m.signRole) span(r, 0, 5, 15, m.signRole, 18);
    var sheet = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
      "<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\">" +
      "<sheetPr><pageSetUpPr fitToPage=\"1\"/></sheetPr><dimension ref=\"A1:F" + r + "\"/>" +
      "<sheetViews><sheetView workbookViewId=\"0\" showGridLines=\"0\" view=\"pageLayout\"/></sheetViews>" +
      "<sheetFormatPr defaultRowHeight=\"18\"/>" +
      "<cols><col min=\"1\" max=\"1\" width=\"8\" customWidth=\"1\"/><col min=\"2\" max=\"2\" width=\"46\" customWidth=\"1\"/><col min=\"3\" max=\"3\" width=\"12\" customWidth=\"1\"/><col min=\"4\" max=\"4\" width=\"12\" customWidth=\"1\"/><col min=\"5\" max=\"5\" width=\"18\" customWidth=\"1\"/><col min=\"6\" max=\"6\" width=\"18\" customWidth=\"1\"/></cols>" +
      "<sheetData>" + rows.join("") + "</sheetData><mergeCells count=\"" + merges.length + "\">" +
      merges.map(function (ref) { return "<mergeCell ref=\"" + ref + "\"/>"; }).join("") + "</mergeCells>" +
      "<printOptions horizontalCentered=\"1\"/><pageMargins left=\"0.4\" right=\"0.4\" top=\"0.5\" bottom=\"0.5\" header=\"0.2\" footer=\"0.2\"/>" +
      "<pageSetup paperSize=\"9\" orientation=\"portrait\" fitToWidth=\"1\" fitToHeight=\"0\" horizontalDpi=\"300\" verticalDpi=\"300\"/>" +
      "</worksheet>";
    var styles = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
      "<styleSheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\">" +
      "<numFmts count=\"1\"><numFmt numFmtId=\"164\" formatCode=\"#,##0\"/></numFmts>" +
      "<fonts count=\"7\">" +
      "<font><sz val=\"11\"/><name val=\"Times New Roman\"/></font>" +
      "<font><b/><sz val=\"16\"/><color rgb=\"FF7A2E24\"/><name val=\"Times New Roman\"/></font>" +
      "<font><sz val=\"11\"/><color rgb=\"FF6B5344\"/><name val=\"Times New Roman\"/></font>" +
      "<font><i/><sz val=\"11\"/><name val=\"Times New Roman\"/></font>" +
      "<font><b/><sz val=\"18\"/><color rgb=\"FF7A2E24\"/><name val=\"Times New Roman\"/></font>" +
      "<font><b/><sz val=\"11\"/><color rgb=\"FFFFFFFF\"/><name val=\"Times New Roman\"/></font>" +
      "<font><b/><sz val=\"11\"/><color rgb=\"FF2C1810\"/><name val=\"Times New Roman\"/></font>" +
      "</fonts><fills count=\"4\"><fill><patternFill patternType=\"none\"/></fill><fill><patternFill patternType=\"gray125\"/></fill>" +
      "<fill><patternFill patternType=\"solid\"><fgColor rgb=\"FF7A2E24\"/><bgColor indexed=\"64\"/></patternFill></fill>" +
      "<fill><patternFill patternType=\"solid\"><fgColor rgb=\"FFFBF6EE\"/><bgColor indexed=\"64\"/></patternFill></fill></fills>" +
      "<borders count=\"2\"><border><left/><right/><top/><bottom/><diagonal/></border><border>" +
      "<left style=\"thin\"><color rgb=\"FFB08D57\"/></left><right style=\"thin\"><color rgb=\"FFB08D57\"/></right><top style=\"thin\"><color rgb=\"FFB08D57\"/></top><bottom style=\"thin\"><color rgb=\"FFB08D57\"/></bottom><diagonal/></border></borders>" +
      "<cellStyleXfs count=\"1\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\"/></cellStyleXfs><cellXfs count=\"16\">" +
      "<xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\"/>" +
      "<xf numFmtId=\"0\" fontId=\"1\" fillId=\"0\" borderId=\"0\" xfId=\"0\" applyFont=\"1\" applyAlignment=\"1\"><alignment horizontal=\"center\" vertical=\"center\"/></xf>" +
      "<xf numFmtId=\"0\" fontId=\"2\" fillId=\"0\" borderId=\"0\" xfId=\"0\" applyFont=\"1\" applyAlignment=\"1\"><alignment horizontal=\"center\" vertical=\"center\" wrapText=\"1\"/></xf>" +
      "<xf numFmtId=\"0\" fontId=\"3\" fillId=\"0\" borderId=\"0\" xfId=\"0\" applyFont=\"1\" applyAlignment=\"1\"><alignment horizontal=\"right\" vertical=\"center\"/></xf>" +
      "<xf numFmtId=\"0\" fontId=\"4\" fillId=\"0\" borderId=\"0\" xfId=\"0\" applyFont=\"1\" applyAlignment=\"1\"><alignment horizontal=\"center\" vertical=\"center\"/></xf>" +
      "<xf numFmtId=\"0\" fontId=\"3\" fillId=\"0\" borderId=\"0\" xfId=\"0\" applyFont=\"1\" applyAlignment=\"1\"><alignment horizontal=\"left\" vertical=\"center\"/></xf>" +
      "<xf numFmtId=\"0\" fontId=\"5\" fillId=\"2\" borderId=\"1\" xfId=\"0\" applyFont=\"1\" applyFill=\"1\" applyBorder=\"1\" applyAlignment=\"1\"><alignment horizontal=\"center\" vertical=\"center\" wrapText=\"1\"/></xf>" +
      "<xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"1\" xfId=\"0\" applyBorder=\"1\" applyAlignment=\"1\"><alignment horizontal=\"left\" vertical=\"center\" wrapText=\"1\"/></xf>" +
      "<xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"1\" xfId=\"0\" applyBorder=\"1\" applyAlignment=\"1\"><alignment horizontal=\"center\" vertical=\"center\"/></xf>" +
      "<xf numFmtId=\"164\" fontId=\"0\" fillId=\"0\" borderId=\"1\" xfId=\"0\" applyNumberFormat=\"1\" applyBorder=\"1\" applyAlignment=\"1\"><alignment horizontal=\"right\" vertical=\"center\"/></xf>" +
      "<xf numFmtId=\"0\" fontId=\"6\" fillId=\"3\" borderId=\"1\" xfId=\"0\" applyFont=\"1\" applyFill=\"1\" applyBorder=\"1\" applyAlignment=\"1\"><alignment horizontal=\"right\" vertical=\"center\"/></xf>" +
      "<xf numFmtId=\"164\" fontId=\"6\" fillId=\"3\" borderId=\"1\" xfId=\"0\" applyNumberFormat=\"1\" applyFont=\"1\" applyFill=\"1\" applyBorder=\"1\" applyAlignment=\"1\"><alignment horizontal=\"right\" vertical=\"center\"/></xf>" +
      "<xf numFmtId=\"0\" fontId=\"5\" fillId=\"2\" borderId=\"1\" xfId=\"0\" applyFont=\"1\" applyFill=\"1\" applyBorder=\"1\" applyAlignment=\"1\"><alignment horizontal=\"right\" vertical=\"center\"/></xf>" +
      "<xf numFmtId=\"164\" fontId=\"5\" fillId=\"2\" borderId=\"1\" xfId=\"0\" applyNumberFormat=\"1\" applyFont=\"1\" applyFill=\"1\" applyBorder=\"1\" applyAlignment=\"1\"><alignment horizontal=\"right\" vertical=\"center\"/></xf>" +
      "<xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\" applyAlignment=\"1\"><alignment horizontal=\"left\" vertical=\"center\" wrapText=\"1\"/></xf>" +
      "<xf numFmtId=\"0\" fontId=\"3\" fillId=\"0\" borderId=\"0\" xfId=\"0\" applyFont=\"1\" applyAlignment=\"1\"><alignment horizontal=\"center\" vertical=\"center\"/></xf>" +
      "</cellXfs></styleSheet>";
    var zip = new window.JSZip();
    zip.file("[Content_Types].xml", "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
      "<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">" +
      "<Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>" +
      "<Default Extension=\"xml\" ContentType=\"application/xml\"/>" +
      "<Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/>" +
      "<Override PartName=\"/xl/worksheets/sheet1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>" +
      "<Override PartName=\"/xl/styles.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml\"/>" +
      "<Override PartName=\"/docProps/core.xml\" ContentType=\"application/vnd.openxmlformats-package.core-properties+xml\"/>" +
      "<Override PartName=\"/docProps/app.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.extended-properties+xml\"/>" +
      "</Types>");
    zip.file("_rels/.rels", "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
      "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">" +
      "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/>" +
      "<Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties\" Target=\"docProps/core.xml\"/>" +
      "<Relationship Id=\"rId3\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties\" Target=\"docProps/app.xml\"/>" +
      "</Relationships>");
    zip.file("xl/workbook.xml", "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
      "<workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\">" +
      "<sheets><sheet name=\"Bao gia\" sheetId=\"1\" r:id=\"rId1\"/></sheets></workbook>");
    zip.file("xl/_rels/workbook.xml.rels", "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
      "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">" +
      "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet1.xml\"/>" +
      "<Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles\" Target=\"styles.xml\"/>" +
      "</Relationships>");
    zip.file("xl/worksheets/sheet1.xml", sheet);
    zip.file("xl/styles.xml", styles);
    zip.file("docProps/core.xml", "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
      "<cp:coreProperties xmlns:cp=\"http://schemas.openxmlformats.org/package/2006/metadata/core-properties\" xmlns:dc=\"http://purl.org/dc/elements/1.1/\"><dc:title>" + xml(m.title || "") + "</dc:title></cp:coreProperties>");
    zip.file("docProps/app.xml", "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
      "<Properties xmlns=\"http://schemas.openxmlformats.org/officeDocument/2006/extended-properties\"><Application>Microsoft Excel</Application></Properties>");
    return zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", compression: "DEFLATE" });
  }
  window.VVDoc = {
    docx: function (m) {
      download(wordFile(m), (m.fileName || "Bang_Bao_Gia") + ".doc");
      return Promise.resolve();
    },
    xlsx: function (m) {
      if (!window.JSZip) throw new Error("zip");
      return buildXlsx(m).then(function (blob) { download(blob, (m.fileName || "Bang_Bao_Gia") + ".xlsx"); });
    }
  };
})();
