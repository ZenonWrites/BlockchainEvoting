from rest_framework import viewsets, permissions, views, status
from django.http import JsonResponse
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import api_view, permission_classes
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator  # required for viewsets
from .models import *
from django.contrib.auth import get_user_model, authenticate
import random
from django.shortcuts import get_object_or_404
from .models import OTP
from django.utils.timezone import now
from datetime import timedelta
from django.shortcuts import render
from .serializers import *
from knox.models import AuthToken
import os
from .blockchain import add_candidate_to_chain
from .blockchain import vote_on_chain
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as filters
from rest_framework.permissions import AllowAny
from datetime import timedelta
from django.contrib.auth import login
from knox.views import LoginView as KnoxLoginView
from knox.auth import TokenAuthentication
from rest_framework.authtoken.serializers import AuthTokenSerializer

User = get_user_model()


class UserDetailAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'wallet_address': user.wallet_address,
            'role': user.role,
            'voter_id': user.voter_id,
            'phone_number': user.phone_number,
            'address': user.address,
            'adhaar_number': user.adhaar_number,
            'is_verified': user.is_verified,
            'created_at': user.created_at,
            'updated_at': user.updated_at,
            'already_voted': user.already_voted,
        })

class PhoneOTPLoginAPI(KnoxLoginView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request, *args, **kwargs):
        phone = request.data.get('phone_number')
        otp_input = request.data.get('otp')

        if not phone or not otp_input:
            return Response({'error': 'Phone number and OTP required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            otp_record = OTP.objects.get(phone_number=phone)
        except OTP.DoesNotExist:
            return Response({'error': 'OTP not found.'},
                            status=status.HTTP_400_BAD_REQUEST)

        if now() - otp_record.created_at > timedelta(minutes=5):
            return Response({'error': 'OTP expired.'},
                            status=status.HTTP_400_BAD_REQUEST)

        if otp_record.otp != otp_input:
            return Response({'error': 'Invalid OTP.'},
                            status=status.HTTP_400_BAD_REQUEST)



        # LOOK UP USER BY PHONE NUMBER
        try:
            user = User.objects.get(phone_number=phone)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'},
                            status=status.HTTP_400_BAD_REQUEST)

        # ISSUE A KNOX TOKEN
        _, token = AuthToken.objects.create(user)  
        print(f"🔑 Generated Knox token for {phone}: {token}")  # debug print
        # Delete the used OTP
      #  otp_record.delete()
        return Response({'token': token}, status=status.HTTP_200_OK)


class LoginAPI(KnoxLoginView):
    permission_classes = (permissions.AllowAny,)  # ← public endpoint

    def post(self, request, format=None):
        serializer = AuthTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        login(request, user)
        return super().post(request, format=None)

@method_decorator(csrf_exempt, name='dispatch')
class LoginViewset(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer

    def create(self, request): 
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid(): 
            user = serializer.validated_data['user']
            token = AuthToken.objects.create(user)
            return Response(
                    {
                        "user": self.serializer_class(user).data,
                        "token": token
                    }
                )

        return Response(serializer.errors,status=400)
        

        

@method_decorator(csrf_exempt, name='dispatch')
class RegisterViewset(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = User.objects.all()
    serializer_class = RegisterSerializer

    def create(self,request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        else: 
            return Response(serializer.errors,status=400)



@csrf_exempt
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def profile(request):
    return Response(UserSerializer(request.user).data)

class UserFilter(filters.FilterSet):
    phone_number = filters.CharFilter(field_name='phone_number', lookup_expr='exact')

    class Meta:
        model = User
        fields = ['phone_number']


@method_decorator(csrf_exempt, name='dispatch')
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['phone_number']

    def list(self,request):
        queryset = User.objects.all()
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data)

@method_decorator(csrf_exempt, name='dispatch')
class ElectionViewSet(viewsets.ModelViewSet):
    queryset = Election.objects.all()
    serializer_class = ElectionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

@method_decorator(csrf_exempt, name='dispatch')
class CandidateViewSet(viewsets.ModelViewSet):
    queryset = Candidate.objects.all()
    serializer_class = CandidateSerializer

    def perform_create(self, serializer):
        user = self.request.user
        election = self.request.data.get('election')
        if Candidate.objects.filter(user=user, election=election).exists():
            raise PermissionDenied("You have already registered as a candidate for this election.")

        candidate = serializer.save(user=user)
        # add candidate to blockchain
        add_candidate_to_chain(candidate.id)

    def get_queryset(self):
        queryset = Candidate.objects.all()
        election = self.request.query_params.get('election')
        if election:
            queryset = queryset.filter(election=election)
        return queryset

@method_decorator(csrf_exempt, name='dispatch')
class BlockchainTransactionViewSet(viewsets.ModelViewSet):
    queryset = BlockchainTransaction.objects.all()
    serializer_class = BlockchainTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

@method_decorator(csrf_exempt, name='dispatch')
class VoteViewSet(viewsets.ModelViewSet):
    queryset = Vote.objects.all()
    serializer_class = VoteSerializer
    authentication_classes = [TokenAuthentication]
    def create(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response({'error': 'You must be authenticated to cast a vote'}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
       # serializer.validated_data['candidate_id'] is a Candidate instance
        candidate = serializer.validated_data['candidate_id']
       # Extract the actual integer primary key
        candidate_pk = candidate.id  # already an int
        voter = request.user
        receipt = vote_on_chain(voter.wallet_address, int(candidate_pk))
        election = serializer.validated_data['election']
         #① check existence
        if Vote.objects.filter(voter=voter, election=election).exists():
             return Response(
                 {"detail": "You have already voted in this election."},
                 status=status.HTTP_400_BAD_REQUEST
             )

        # ② proceed to send on‑chain + save
        
        # send vote tx on-chain
        # save on DB with tx hash
        tx = BlockchainTransaction.objects.create(
            transaction_hash=receipt.transactionHash.hex(),
            sender=voter,
            receiver=voter,  # or contract address
            data={'candidate': candidate_pk}
        )
        vote = Vote.objects.create(
            voter=request.user,
            election=serializer.validated_data['election'],
            candidate=candidate,
            transaction=tx
        )
        return Response(VoteSerializer(vote).data, status=status.HTTP_201_CREATED)


@csrf_exempt 
def request_otp(request):
    if request.method == "POST":
        import json
        data = json.loads(request.body)
        phone_number = data.get("phoneNumber")

        if not phone_number:
            return JsonResponse({"error": "Phone number is required"}, status=400)

        def generate_otp():
            return str(random.randint(100000, 999999))

        otp = generate_otp()
        OTP.objects.update_or_create(phone_number=phone_number, defaults={"otp": otp, "created_at": now()})

        print(f"OTP for {phone_number} is {otp}")

        return JsonResponse({"message": "OTP sent successfully"}, status=200)


@api_view(['POST'])
@csrf_exempt
def verify_otp(request):
    phone_number = request.data.get('phone_number')
    otp_input = request.data.get('otp')

    if not phone_number or not otp_input:
        return Response({'error': 'Phone number and OTP are required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        otp_record = OTP.objects.get(phone_number=phone_number)
    except OTP.DoesNotExist:
        return Response({'error': 'OTP not found.'}, status=status.HTTP_400_BAD_REQUEST)

    # Check if OTP is valid (not expired)
    if now() - otp_record.created_at > timedelta(minutes=5):
        return Response({'error': 'OTP has expired.'}, status=status.HTTP_400_BAD_REQUEST)

    if otp_record.otp != otp_input:
        return Response({'error': 'Invalid OTP.'}, status=status.HTTP_400_BAD_REQUEST)

    # OTP is valid; proceed to verify the user
    try:
        user = CustomUser.objects.get(phone_number=phone_number)
        user.is_verified = True
        user.save()
    except CustomUser.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_400_BAD_REQUEST)

    # Optionally, delete the OTP record after successful verification
  #  otp_record.delete()

    return Response({'message': 'OTP verified successfully.'}, status=status.HTTP_200_OK)


class CheckPhoneNumberView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        phone_number = request.query_params.get('phone_number')
        if phone_number:
            if User.objects.filter(phone_number=phone_number).exists():
                return Response({'exists': True})
            else:
                return Response({'exists': False})
        else:
            return Response({'error': 'Phone number is required'}, status=400)
        
class PhoneNumberListView(APIView):
    def get(self, request):
        users = User.objects.all()
        phone_numbers = [{'id': user.id, 'phone_number': user.phone_number} for user in users]
        return Response(phone_numbers)
    
# @csrf_exempt
# @permission_classes([permissions.IsAuthenticated])
# def get_user_by_phone_number(request):
#     token = request.auth
#     phone_number = request.user.phone_number
#     user = User.objects.get(phone_number=phone_number)
#     serializer = UserSerializer(user)
#     return Response({'token': token, 'user': serializer.data})

class VotingResultViewSet(viewsets.ModelViewSet):
    queryset = VotingResult.objects.all()
    serializer_class = VotingResultSerializer