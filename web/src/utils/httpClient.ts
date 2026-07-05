interface RequestConfig {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

interface RequestOptions extends Omit<RequestConfig, "body"> {
  params?: Record<string, string | number | boolean>;
}

export class HttpClient {
  private static instance: HttpClient;
  private baseURL: string = "";
  private defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };
  private defaultTimeout: number = 10000; // 10 seconds

  private constructor() {}

  /**
   * Obtiene la instancia singleton del cliente HTTP
   */
  public static getInstance(): HttpClient {
    if (!HttpClient.instance) {
      HttpClient.instance = new HttpClient();
    }
    return HttpClient.instance;
  }

  /**
   * Configura la URL base para todas las peticiones
   */
  public setBaseURL(url: string): HttpClient {
    this.baseURL = url.endsWith("/") ? url.slice(0, -1) : url;
    return this;
  }

  /**
   * Obtiene la URL base actual
   */
  public getBaseURL(): string {
    return this.baseURL;
  }

  /**
   * Configura headers por defecto
   */
  public setDefaultHeaders(headers: Record<string, string>): HttpClient {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
    return this;
  }

  /**
   * Configura el timeout por defecto
   */
  public setDefaultTimeout(timeout: number): HttpClient {
    this.defaultTimeout = timeout;
    return this;
  }

  /**
   * Añade un header de autorización
   */
  public setAuthToken(
    token: string,
    type: "Bearer" | "Basic" = "Bearer"
  ): HttpClient {
    this.defaultHeaders["Authorization"] = `${type} ${token}`;
    return this;
  }

  /**
   * Elimina el header de autorización
   */
  public removeAuthToken(): HttpClient {
    delete this.defaultHeaders["Authorization"];
    return this;
  }

  /**
   * Construye la URL completa
   */
  private buildURL(
    endpoint: string,
    params?: Record<string, string | number | boolean>
  ): string {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${this.baseURL}${endpoint}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, String(value));
      });
      return `${url}?${searchParams.toString()}`;
    }

    return url;
  }

  /**
   * Realiza una petición HTTP
   */
  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const {
      method = "GET",
      headers = {},
      body,
      timeout = this.defaultTimeout,
    } = config;

    const url = this.buildURL(endpoint);
    const mergedHeaders = { ...this.defaultHeaders, ...headers };

    // Crear AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: mergedHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Verificar si la respuesta es exitosa
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP Error ${response.status}: ${errorData}`);
      }

      // Verificar si hay contenido para parsear
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      }

      return (await response.text()) as unknown as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new Error(`Request timeout after ${timeout}ms`);
        }
        throw error;
      }

      throw new Error("Unknown error occurred");
    }
  }

  /**
   * Petición GET
   */
  public async get<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, ...config } = options;
    const url = params ? this.buildURL(endpoint, params) : endpoint;

    return this.request<T>(url, { ...config, method: "GET" });
  }

  /**
   * Petición POST
   */
  public async post<T>(
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, ...config } = options;
    const url = params ? this.buildURL(endpoint, params) : endpoint;

    return this.request<T>(url, { ...config, method: "POST", body: data });
  }

  /**
   * Petición PUT
   */
  public async put<T>(
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, ...config } = options;
    const url = params ? this.buildURL(endpoint, params) : endpoint;

    return this.request<T>(url, { ...config, method: "PUT", body: data });
  }

  /**
   * Petición DELETE
   */
  public async delete<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, ...config } = options;
    const url = params ? this.buildURL(endpoint, params) : endpoint;

    return this.request<T>(url, { ...config, method: "DELETE" });
  }

  /**
   * Petición PATCH
   */
  public async patch<T>(
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, ...config } = options;
    const url = params ? this.buildURL(endpoint, params) : endpoint;

    return this.request<T>(url, { ...config, method: "PATCH", body: data });
  }
}

// Exportar la instancia singleton
export const httpClient = HttpClient.getInstance();

// Exportar el tipo para uso externo
export type { RequestConfig, RequestOptions };
