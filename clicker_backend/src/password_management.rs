use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use argon2::password_hash::SaltString;
use rand_core::OsRng;

//// Methods for Password hashing and verifying

/// Hashes the given password
pub fn hash_password(password: &[u8]) -> String {
    let argon2 = Argon2::default();
    let salt = SaltString::generate(OsRng);
    let password_hash = argon2.hash_password(password, &salt).unwrap().to_string();
    let parsed_hash = PasswordHash::new(&password_hash).unwrap();
    assert!(Argon2::default().verify_password(password, &parsed_hash).is_ok());
    password_hash
}

/// Verifies if the given password is analog to the hashed
pub fn verify_password(password_hash: String, password: &[u8]) -> bool {
    let parsed_hash = PasswordHash::new(&password_hash).unwrap();
    Argon2::default().verify_password(password, &parsed_hash).is_ok()
}


/// Tests
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_password_positive() {
        let hashed_password = hash_password("test123".as_bytes());
        assert!(verify_password(hashed_password, "test123".as_bytes()));
    }

    #[test]
    fn test_password_negative() {
        let hashed_password = hash_password("test1234".as_bytes());
        assert!(!verify_password(hashed_password, "test123".as_bytes()));
    }
}