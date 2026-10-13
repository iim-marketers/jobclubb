import "server-only";

import {
  Document,
  Image as PdfImage,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";

import { EMAIL_LOGO_PNG } from "@/lib/email/assets/logo";
import { GST_RATE, SUPPLIER, amountInWords, stateLabel } from "@/lib/gst";
import { formatIst } from "@/lib/interviews";
import type { Invoice } from "@/server/candidates/invoice";

const INK = "#0f1d24";
const MUTED = "#6b7a82";
const RULE = "#d9e3e8";
const BAND = "#f2f6f8";
const BRAND = "#00789f";

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9, lineHeight: 1.45, color: INK },
  band: {
    backgroundColor: BAND,
    paddingVertical: 18,
    paddingHorizontal: "14mm",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: { width: 116, height: 29 },
  title: { fontSize: 16, fontFamily: "Helvetica-Bold", textAlign: "right" },
  subtitle: { color: MUTED, textAlign: "right", marginTop: 2 },
  body: { paddingHorizontal: "14mm", paddingTop: 18 },
  columns: { flexDirection: "row", gap: 24 },
  column: { flex: 1 },
  label: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: MUTED,
    marginBottom: 4,
  },
  bold: { fontFamily: "Helvetica-Bold" },
  muted: { color: MUTED },
  meta: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  section: { marginTop: 18 },
  table: { borderWidth: 1, borderColor: RULE, borderRadius: 4 },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: RULE },
  th: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: MUTED,
    backgroundColor: BAND,
  },
  td: { paddingVertical: 8, paddingHorizontal: 8 },
  colNo: { width: 28 },
  colDesc: { flex: 1 },
  colSac: { width: 64 },
  colAmount: { width: 124, textAlign: "right" },
  totals: { marginLeft: "auto", width: 230, marginTop: 10 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: INK,
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
  },
  words: { marginTop: 10, padding: 8, backgroundColor: BAND, borderRadius: 4 },
  footer: {
    position: "absolute",
    bottom: "12mm",
    left: "14mm",
    right: "14mm",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: RULE,
    color: MUTED,
    fontSize: 8,
    textAlign: "center",
  },
});

const money = (paise: number) =>
  new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    paise / 100,
  );

const day = (iso: string) => formatIst(iso, { day: "numeric", month: "short", year: "numeric" });

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.meta}>
      <Text style={s.muted}>{label}</Text>
      <Text style={s.bold}>{value}</Text>
    </View>
  );
}

function TotalRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={s.totalRow}>
      <Text style={s.muted}>{label}</Text>
      <Text>{money(value)}</Text>
    </View>
  );
}

function InvoicePdf({ invoice }: { invoice: Invoice }) {
  const half = GST_RATE / 2;
  const interState = invoice.igst > 0;

  return (
    <Document
      title={`Invoice ${invoice.invoiceNumber}`}
      author={SUPPLIER.legalName}
      subject={`${invoice.item.name} invoice`}
    >
      <Page size="A4" style={s.page}>
        <View style={s.band}>
          <PdfImage src={{ data: EMAIL_LOGO_PNG, format: "png" }} style={s.logo} />
          <View>
            <Text style={s.title}>Tax Invoice</Text>
            <Text style={s.subtitle}>Original for recipient</Text>
          </View>
        </View>

        <View style={s.body}>
          <View style={s.columns}>
            <View style={s.column}>
              <Text style={s.label}>Sold by</Text>
              <Text style={s.bold}>{SUPPLIER.legalName}</Text>
              <Text style={s.muted}>Trading as {SUPPLIER.brand}</Text>
              {SUPPLIER.address.map((line) => (
                <Text key={line}>{line}</Text>
              ))}
              <Text style={{ marginTop: 4 }}>
                <Text style={s.muted}>GSTIN </Text>
                <Text style={s.bold}>{SUPPLIER.gstin}</Text>
              </Text>
              <Text>
                <Text style={s.muted}>State </Text>
                {stateLabel(SUPPLIER.stateCode)}
              </Text>
            </View>
            <View style={s.column}>
              <Text style={s.label}>Invoice details</Text>
              <Meta label="Invoice number" value={invoice.invoiceNumber} />
              <Meta label="Invoice date" value={day(invoice.issuedAt)} />
              <Meta label="Place of supply" value={stateLabel(invoice.placeOfSupply)} />
              <Meta label="Tax payable on reverse charge" value="No" />
            </View>
          </View>

          <View style={s.section}>
            <Text style={s.label}>Billed to</Text>
            <Text style={s.bold}>{invoice.billedTo.name}</Text>
            <Text>{invoice.billedTo.email}</Text>
            <Text>
              {invoice.billedTo.city} {invoice.billedTo.pincode},{" "}
              {stateLabel(invoice.placeOfSupply)}
            </Text>
          </View>

          <View style={[s.section, s.table]}>
            <View style={s.tr}>
              <Text style={[s.th, s.colNo]}>#</Text>
              <Text style={[s.th, s.colDesc]}>Description</Text>
              <Text style={[s.th, s.colSac]}>SAC</Text>
              <Text style={[s.th, s.colAmount]}>Taxable value (INR)</Text>
            </View>
            <View style={[s.tr, { borderBottomWidth: 0 }]}>
              <Text style={[s.td, s.colNo]}>1</Text>
              <View style={[s.td, s.colDesc]}>
                <Text style={s.bold}>{invoice.item.name}</Text>
                <Text style={s.muted}>{invoice.item.detail}</Text>
              </View>
              <Text style={[s.td, s.colSac]}>{invoice.item.sac}</Text>
              <Text style={[s.td, s.colAmount]}>{money(invoice.taxable)}</Text>
            </View>
          </View>

          <View style={s.totals}>
            <TotalRow label="Taxable value" value={invoice.taxable} />
            {interState ? (
              <TotalRow label={`IGST @ ${GST_RATE}%`} value={invoice.igst} />
            ) : (
              <>
                <TotalRow label={`CGST @ ${half}%`} value={invoice.cgst} />
                <TotalRow label={`SGST @ ${half}%`} value={invoice.sgst} />
              </>
            )}
            <View style={s.grandTotal}>
              <Text>Total (INR)</Text>
              <Text>{money(invoice.amount)}</Text>
            </View>
          </View>

          <View style={s.words}>
            <Text>
              <Text style={s.muted}>Amount in words: </Text>
              <Text style={s.bold}>{amountInWords(invoice.amount)}</Text>
            </Text>
          </View>

          <View style={s.section}>
            <Text style={s.label}>Payment</Text>
            <Text>
              Paid in full via Razorpay on {day(invoice.issuedAt)},{" "}
              {formatIst(invoice.issuedAt, { hour: "numeric", minute: "2-digit" })} IST
            </Text>
            <Text>
              <Text style={s.muted}>Payment ID </Text>
              {invoice.paymentId}
            </Text>
          </View>
        </View>

        <View style={s.footer} fixed>
          <Text>
            This is a computer-generated invoice and does not require a signature.
          </Text>
          <Text>
            Questions about this invoice? Email{" "}
            <Text style={{ color: BRAND }}>support@jobclubb.com</Text>
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export function renderInvoicePdf(invoice: Invoice) {
  return renderToBuffer(<InvoicePdf invoice={invoice} />);
}
