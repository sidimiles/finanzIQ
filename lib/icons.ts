export function accountTypeIcon(type: string): any {
  switch (type) {
    case 'checking':
      return 'card-outline';
    case 'savings':
      return 'trending-up-outline';
    case 'cash':
      return 'cash-outline';
    case 'credit_card':
      return 'card';
    case 'investment':
      return 'stats-chart-outline';
    default:
      return 'wallet-outline';
  }
}
