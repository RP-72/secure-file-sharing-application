def create_verification_token(user):
    # Use the for_user() method of our custom VerificationToken
    token = VerificationToken.for_user(user)
    # Override the token_type to be 'verification'
    token.payload['token_type'] = 'verification'
    return str(token) 

class VerificationToken(AccessToken):
    token_type = 'verification'
    lifetime = timedelta(minutes=5)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if 'token_type' not in self.payload:
            self.payload['token_type'] = 'verification'
        self.payload['exp'] = datetime.now(timezone.utc) + self.lifetime 