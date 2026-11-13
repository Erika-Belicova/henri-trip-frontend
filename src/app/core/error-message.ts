import { HttpErrorResponse } from '@angular/common/http';
import type { ApiErrorResponseDTO } from '../shared/interfaces/api-error-response-dto';

// turn a failed request into a short, user-facing message
export function toErrorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Une erreur inattendue est survenue.';
  }

  if (error.status === 0) {
    return 'Serveur injoignable. Vérifiez que l’API est démarrée.';
  }

  const body = error.error as Partial<ApiErrorResponseDTO> | null;
  const validationMessages = Object.values(body?.validationErrors ?? {});

  if (validationMessages.length > 0) {
    return validationMessages.join(' ');
  }

  switch (error.status) {
    case 401:
      return body?.message ?? 'Veuillez vous authentifier pour accéder à cette ressource.';
    case 403:
      return 'Vous n’avez pas accès à cette ressource.';
    case 404:
      return 'Ressource introuvable.';
    default:
      return body?.message ?? 'Une erreur est survenue. Réessayez dans un instant.';
  }
}