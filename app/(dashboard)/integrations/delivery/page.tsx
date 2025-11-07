export default function DeliveryIntegrations(){
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Delivery Integrations</h1>
      <div className="card"><div className="card-pad grid gap-3">
        {["RedX","Pathao","Steadfast"].map(n => (
          <div key={n} className="flex items-center justify-between rounded-xl border p-4">
            <div>
              <div className="font-medium">{n}</div>
              <div className="text-sm text-gray-600">Connect your {n} account</div>
            </div>
            <button className="btn btn-outline">Connect</button>
          </div>
        ))}
      </div></div>
    </div>
  )
}
