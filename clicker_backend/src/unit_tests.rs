#[cfg(test)]
mod tests {
    use crate::{check_password, hash_password};
    use super::*;

    #[test]
    fn test_password_positive() {
        let hashed_password = hash_password("test123".as_bytes());
        assert!(check_password(hashed_password, "test123".as_bytes()));
    }

    #[test]
    fn test_password_negative() {
        let hashed_password = hash_password("test1234".as_bytes());
        assert!(!check_password(hashed_password, "test123".as_bytes()));
    }
}