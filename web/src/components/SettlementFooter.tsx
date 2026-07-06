function truncateAddress(address: string): string {
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function SettlementFooter({
  sellerAddress,
  network,
}: {
  sellerAddress: string | null;
  network: string | null;
}) {
  if (!sellerAddress || !network) {
    return null;
  }

  const explorerUrl = `https://testnet.arcscan.app/address/${sellerAddress}`;

  return (
    <footer className="w-full border-t border-subtle px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-3xl min-w-0 flex-col items-center gap-2 text-center">
        <p className="min-w-0 break-words text-xs text-ink-label">
          Settled on Arc Testnet ({network}) · Seller{" "}
          <span title={sellerAddress} className="font-medium text-ink-body">
            {truncateAddress(sellerAddress)}
          </span>
        </p>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 break-words text-xs font-medium text-accent-light underline underline-offset-2 transition-colors hover:text-ink-heading"
        >
          Verify seller activity on Arcscan →
        </a>
      </div>
    </footer>
  );
}
