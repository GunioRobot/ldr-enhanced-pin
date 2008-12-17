package LivedoorReader::Pins;
use strict;
use warnings;

use JSON::Syck;
use File::Slurp;

use Encode;

use base qw( Class::Accessor::Fast );
__PACKAGE__->mk_accessors(qw/file data errorcode/);

sub new {
    my $pkg = shift;
    my %opt = @_;
    
    my $self = {
        file => $opt{file} || "./pin.json",
        data => {
            array => [],
            hash => {}
        },
        errorcode => 0,
    };
    
    bless $self, $pkg;
    
    $self->load;
    
    return $self;
}

sub DESTORY {
    my $self = shift;
    if ($self->is_modified) {
        $self->save;
    }
}

sub load {
    my $self = shift;
    
    if (-e $self->{file}) {
        my $json = join '', read_file($self->{file});
        my $data = JSON::Syck::Load($json);
        $self->{data} = $data;
    }
    else {
        $self->errorcode(5);
    }
}

sub save {
    my $self = shift;
    
    $self->save_as($self->{file});
}

sub save_as {
    my ($self, $file) = @_;
    
    my $json = JSON::Syck::Dump($self->data);
    
    write_file($file, $json);
}

sub all {
    my $self = shift;
    my $data = $self->data;
    
    my @r = map {$data->{hash}->{$_}} @{$data->{array}};
    return JSON::Syck::Dump(\@r);
}

sub add {
    my ($self, $pin) = @_;
    my $data = $self->data;
    
    $pin->{created_on} = time;
    if ($pin->{link}) {
        unless ($data->{hash}->{$pin->{link}}) {
            unshift @{$data->{array}}, $pin->{link};
            $data->{hash}->{$pin->{link}} = $pin;
        }
        else {
            $self->errorcode(1);
        }
    }
    else {
        $self->errorcode(2);
    }
}

sub remove {
    my ($self, $pin) = @_;
    my $data = $self->data;
    
    if ($data->{hash}->{$pin->{link}}) {
        my @new_array = grep {$_ ne $pin->{link}} @{$data->{array}};
        $data->{array} = \@new_array;
        delete $data->{hash}->{$pin->{link}};
    }
    else {
        $self->errorcode(3);
    }
}

sub clear {
    my $self = shift;
    
    $self->data({
        array => [],
        hash => {}
    });
}

sub result {
    my $self = shift;
    my $error = $self->{errorcode};
    
    my $r = {
        ErrorCode => $error,
        isSuccess => ($error) ? 0 : 1,
    };
    
    return JSON::Syck::Dump($r);
}


1;

