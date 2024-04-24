CREATE TABLE IF NOT EXISTS organisations (
    id VARCHAR(26) PRIMARY KEY
    ,org_name VARCHAR(255) NOT NULL
    ,org_domain VARCHAR(255) NOT NULL
    ,org_access_key VARCHAR(50) NOT NULL
    ,blocked BOOLEAN DEFAULT FALSE

    ,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

    ,UNIQUE INDEX idx_org_domain (org_domain)
    ,INDEX idx_org_access_key (org_access_key)
);

---
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(26) PRIMARY KEY
  ,user_type VARCHAR(25) NOT NULL
  ,email VARCHAR(255) NOT NULL UNIQUE
  ,hashed_password VARCHAR(255) NOT NULL
  ,org_id VARCHAR(26)
  ,blocked BOOLEAN DEFAULT FALSE

  ,created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ,updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

  ,INDEX idx_email_password (email, hashed_password)
  ,INDEX idx_org_id (org_id)
);

---

CREATE TABLE IF NOT EXISTS access_tokens (
  resource_id VARCHAR(26) NOT NULL
  ,resource_type VARCHAR(25) NOT NULL
  ,access_token VARCHAR(255) NOT NULL
  ,refresh_token VARCHAR(255) NOT NULL
  ,access_expires_at DATETIME
  ,refresh_expires_at DATETIME
  ,created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ,updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

  ,INDEX idx_resource_tokens (access_token, refresh_token)
);
