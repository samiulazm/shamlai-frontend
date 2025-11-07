export default function Billing(){
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Billing & Subscription</h1>
      <div className="card"><div className="card-pad grid gap-4">
        <div className="rounded-xl border p-4">
          <div className="font-medium">Current Plan</div>
          <div className="text-sm text-gray-600">Growth — ৳1490/mo</div>
          <button className="btn btn-outline mt-2">Change Plan</button>
        </div>
        <div className="rounded-xl border p-4">
          <div className="font-medium">Invoices</div>
          <div className="mt-2 text-sm text-gray-600">No invoices yet.</div>
        </div>
      </div></div>
    </div>
  )
}
